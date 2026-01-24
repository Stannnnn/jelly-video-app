use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State, Emitter};
use futures_util::StreamExt;
use tokio::io::AsyncWriteExt;
use tokio_util::sync::CancellationToken;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StorageTrack {
    #[serde(rename = "type")]
    pub track_type: String,
    pub timestamp: i64,
    pub media_item: serde_json::Value,
    pub bitrate: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub container_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_sources: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageMetadata {
    pub tracks: HashMap<String, StorageTrack>,
}

#[derive(Default)]
pub struct DownloadManager {
    cancellation_token: Arc<Mutex<Option<CancellationToken>>>,
}

fn get_storage_dir(app: &AppHandle) -> tauri::Result<PathBuf> {
    let app_data_dir = app.path().app_data_dir()?;
    let storage_dir = app_data_dir.join("offline_storage");
    fs::create_dir_all(&storage_dir)?;
    Ok(storage_dir)
}

#[tauri::command]
pub fn get_storage_path(app: AppHandle) -> Result<String, String> {
    let storage_dir = get_storage_dir(&app).map_err(|e| e.to_string())?;
    Ok(storage_dir.to_string_lossy().to_string())
}

fn get_metadata_path(app: &AppHandle) -> tauri::Result<PathBuf> {
    let storage_dir = get_storage_dir(app)?;
    Ok(storage_dir.join("metadata.json"))
}

fn load_metadata(app: &AppHandle) -> tauri::Result<StorageMetadata> {
    let metadata_path = get_metadata_path(app)?;
    
    if !metadata_path.exists() {
        return Ok(StorageMetadata {
            tracks: HashMap::new(),
        });
    }
    
    let content = fs::read_to_string(&metadata_path)?;
    let metadata: StorageMetadata = serde_json::from_str(&content)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::InvalidData, e)))?;
    
    Ok(metadata)
}

fn save_metadata(app: &AppHandle, metadata: &StorageMetadata) -> tauri::Result<()> {
    let metadata_path = get_metadata_path(app)?;
    let content = serde_json::to_string(metadata)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::InvalidData, e)))?;
    fs::write(&metadata_path, content)?;
    Ok(())
}

#[tauri::command]
pub async fn storage_save_track(
    app: AppHandle,
    download_manager: State<'_, DownloadManager>,
    id: String,
    data: StorageTrack,
    video_url: Option<String>,
    thumbnail_url: Option<String>,
) -> Result<(), String> {
    println!("storage_save_track: Starting to save track with id: {}", id);
    
    // Check if download already in progress
    {
        let token = download_manager.cancellation_token.lock().unwrap();
        if token.is_some() {
            let err_msg = "Download already in progress".to_string();
            println!("storage_save_track: Error - {}", err_msg);
            return Err(err_msg);
        }
    }
    
    let storage_dir = get_storage_dir(&app).map_err(|e| e.to_string())?;
    
    // Create cancellation token for this download
    let cancel_token = CancellationToken::new();
    {
        let mut token = download_manager.cancellation_token.lock().unwrap();
        *token = Some(cancel_token.clone());
    }
    
    // Download video blob if URL is provided
    if let Some(url) = video_url {
        println!("storage_save_track: Downloading video from URL for id: {}", id);
        let client = reqwest::Client::new();
        let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
        
        if !response.status().is_success() {
            let err_msg = format!("Failed to download video: HTTP {}", response.status());
            println!("storage_save_track: Error - {}", err_msg);
            // Cleanup token on error
            *download_manager.cancellation_token.lock().unwrap() = None;
            return Err(err_msg);
        }
        
        let total_size = response.content_length().unwrap_or(0);
        let blob_path = storage_dir.join(format!("{}.blob", id));
        
        // Create file for writing
        let mut file = tokio::fs::File::create(&blob_path).await.map_err(|e| {
            *download_manager.cancellation_token.lock().unwrap() = None;
            e.to_string()
        })?;
        let mut stream = response.bytes_stream();
        let mut downloaded: u64 = 0;
        let mut last_emit_time = std::time::Instant::now();
        let mut last_emit_downloaded: u64 = 0;
        
        // Download in chunks and emit progress
        loop {
            tokio::select! {
                _ = cancel_token.cancelled() => {
                    println!("storage_save_track: Download cancelled for id: {}", id);
                    // Remove partial file
                    let _ = tokio::fs::remove_file(&blob_path).await;
                    *download_manager.cancellation_token.lock().unwrap() = None;
                    return Err("Download cancelled".to_string());
                }
                chunk_result = stream.next() => {
                    match chunk_result {
                        Some(Ok(chunk)) => {
                            file.write_all(&chunk).await.map_err(|e| {
                                *download_manager.cancellation_token.lock().unwrap() = None;
                                e.to_string()
                            })?;
                            downloaded += chunk.len() as u64;
                            
                            let now = std::time::Instant::now();
                            let elapsed = now.duration_since(last_emit_time).as_secs_f64();
                            
                            // Emit progress event every 0.5 seconds (debounced)
                            if elapsed >= 0.5 {
                                let progress = if total_size > 0 {
                                    (downloaded as f64 / total_size as f64 * 100.0) as u32
                                } else {
                                    0
                                };
                                
                                // Calculate speed (bytes per second)
                                let bytes_since_last = downloaded - last_emit_downloaded;
                                let speed = if elapsed > 0.0 {
                                    bytes_since_last as f64 / elapsed
                                } else {
                                    0.0
                                };
                                
                                // Calculate time remaining (seconds)
                                let remaining_bytes = total_size.saturating_sub(downloaded);
                                let time_remaining = if speed > 0.0 {
                                    remaining_bytes as f64 / speed
                                } else {
                                    0.0
                                };
                                
                                let _ = app.emit("download-progress", serde_json::json!({
                                    "id": id,
                                    "downloaded": downloaded,
                                    "total": total_size,
                                    "progress": progress,
                                    "speed": speed,
                                    "timeRemaining": time_remaining
                                }));
                                
                                last_emit_time = now;
                                last_emit_downloaded = downloaded;
                            }
                        }
                        Some(Err(e)) => {
                            *download_manager.cancellation_token.lock().unwrap() = None;
                            return Err(e.to_string());
                        }
                        None => break,
                    }
                }
            }
        }
        
        file.flush().await.map_err(|e| {
            *download_manager.cancellation_token.lock().unwrap() = None;
            e.to_string()
        })?;
        println!("storage_save_track: Video saved successfully ({} bytes) for id: {}", downloaded, id);
    }
    
    // Download thumbnail if URL is provided
    if let Some(url) = thumbnail_url {
        println!("storage_save_track: Downloading thumbnail from URL for id: {}", id);
        let client = reqwest::Client::new();
        let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
        
        if response.status().is_success() {
            let thumbnail_data = response.bytes().await.map_err(|e| e.to_string())?;
            let thumbnail_size = thumbnail_data.len();
            let thumbnail_path = storage_dir.join(format!("{}.thumb", id));
            fs::write(thumbnail_path, thumbnail_data).map_err(|e| e.to_string())?;
            println!("storage_save_track: Thumbnail saved successfully ({} bytes) for id: {}", thumbnail_size, id);
        } else {
            println!("storage_save_track: Thumbnail download failed with status: {}", response.status());
        }
    }
    
    // Update metadata
    println!("storage_save_track: Updating metadata for id: {}", id);
    let mut metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    metadata.tracks.insert(id.clone(), data);
    save_metadata(&app, &metadata).map_err(|e| e.to_string())?;
    println!("storage_save_track: Track saved successfully with id: {}", id);
    
    // Remove cancellation token on success
    *download_manager.cancellation_token.lock().unwrap() = None;
    
    Ok(())
}

#[tauri::command]
pub async fn storage_get_track(
    app: AppHandle,
    id: String,
) -> Result<Option<StorageTrack>, String> {
    let metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    Ok(metadata.tracks.get(&id).cloned())
}

#[tauri::command]
pub async fn storage_has_track(app: AppHandle, id: String) -> Result<bool, String> {
    let metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    Ok(metadata.tracks.contains_key(&id))
}

#[tauri::command]
pub async fn storage_remove_track(app: AppHandle, id: String) -> Result<(), String> {
    let storage_dir = get_storage_dir(&app).map_err(|e| e.to_string())?;
    
    // Remove blob file
    let blob_path = storage_dir.join(format!("{}.blob", id));
    if blob_path.exists() {
        fs::remove_file(blob_path).map_err(|e| e.to_string())?;
    }
    
    // Remove thumbnail file
    let thumbnail_path = storage_dir.join(format!("{}.thumb", id));
    if thumbnail_path.exists() {
        fs::remove_file(thumbnail_path).map_err(|e| e.to_string())?;
    }
    
    // Update metadata
    let mut metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    
    // If this is a container, also remove all children
    if let Some(track) = metadata.tracks.get(&id) {
        if track.track_type == "container" {
            let children: Vec<String> = metadata
                .tracks
                .iter()
                .filter(|(_, t)| t.container_id.as_ref() == Some(&id))
                .map(|(k, _)| k.clone())
                .collect();
            
            for child_id in children {
                // Remove child files
                let child_blob_path = storage_dir.join(format!("{}.blob", child_id));
                if child_blob_path.exists() {
                    fs::remove_file(child_blob_path).map_err(|e| e.to_string())?;
                }
                let child_thumb_path = storage_dir.join(format!("{}.thumb", child_id));
                if child_thumb_path.exists() {
                    fs::remove_file(child_thumb_path).map_err(|e| e.to_string())?;
                }
                metadata.tracks.remove(&child_id);
            }
        }
    }
    
    metadata.tracks.remove(&id);
    save_metadata(&app, &metadata).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn storage_get_file_path(app: AppHandle, id: String) -> Result<Option<String>, String> {
    let storage_dir = get_storage_dir(&app).map_err(|e| e.to_string())?;
    let blob_path = storage_dir.join(format!("{}.blob", id));
    
    if !blob_path.exists() {
        return Ok(None);
    }
    
    Ok(Some(blob_path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn storage_get_thumbnail(app: AppHandle, id: String) -> Result<Option<Vec<u8>>, String> {
    let storage_dir = get_storage_dir(&app).map_err(|e| e.to_string())?;
    let thumbnail_path = storage_dir.join(format!("{}.thumb", id));
    
    if !thumbnail_path.exists() {
        return Ok(None);
    }
    
    let data = fs::read(thumbnail_path).map_err(|e| e.to_string())?;
    Ok(Some(data))
}

#[tauri::command]
pub async fn storage_get_track_count(app: AppHandle, kind: String) -> Result<usize, String> {
    let metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    let count = metadata
        .tracks
        .values()
        .filter(|track| {
            if let Some(media_item) = track.media_item.as_object() {
                if let Some(item_type) = media_item.get("Type") {
                    return item_type.as_str() == Some(&kind);
                }
            }
            false
        })
        .count();
    Ok(count)
}

#[tauri::command]
pub async fn storage_clear_all(app: AppHandle) -> Result<(), String> {
    let storage_dir = get_storage_dir(&app).map_err(|e| e.to_string())?;
    
    // Remove all files in storage directory
    if storage_dir.exists() {
        fs::remove_dir_all(&storage_dir).map_err(|e| e.to_string())?;
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn storage_get_page(
    app: AppHandle,
    page_index: usize,
    item_kind: String,
    items_per_page: usize,
) -> Result<Vec<serde_json::Value>, String> {
    let metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    
    // Filter and sort by timestamp (descending)
    let mut filtered: Vec<_> = metadata
        .tracks
        .iter()
        .filter(|(_, track)| {
            if let Some(media_item) = track.media_item.as_object() {
                if let Some(item_type) = media_item.get("Type") {
                    return item_type.as_str() == Some(&item_kind);
                }
            }
            false
        })
        .collect();
    
    filtered.sort_by(|a, b| b.1.timestamp.cmp(&a.1.timestamp));
    
    let start = page_index * items_per_page;
    
    let page_items: Vec<serde_json::Value> = filtered
        .iter()
        .skip(start)
        .take(items_per_page)
        .map(|(id, track)| {
            let mut media_item = track.media_item.clone();
            
            // Add media sources if present
            if let Some(media_sources) = &track.media_sources {
                if let Some(obj) = media_item.as_object_mut() {
                    obj.insert("MediaSources".to_string(), media_sources.clone());
                }
            }
            
            // Mark that thumbnail is available (will be loaded separately)
            let storage_dir = get_storage_dir(&app).unwrap_or_default();
            let thumbnail_path = storage_dir.join(format!("{}.thumb", id));
            if thumbnail_path.exists() {
                if let Some(obj) = media_item.as_object_mut() {
                    obj.insert("hasThumbnail".to_string(), serde_json::Value::Bool(true));
                }
            }
            
            media_item
        })
        .collect();
    
    Ok(page_items)
}

#[tauri::command]
pub async fn storage_search_items(
    app: AppHandle,
    search_term: String,
    limit: usize,
) -> Result<Vec<serde_json::Value>, String> {
    let metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    let search_lower = search_term.to_lowercase();
    
    if search_term.trim().is_empty() {
        return Ok(vec![]);
    }
    
    let results: Vec<serde_json::Value> = metadata
        .tracks
        .iter()
        .filter(|(_, track)| {
            if let Some(media_item) = track.media_item.as_object() {
                if let Some(name) = media_item.get("Name").and_then(|n| n.as_str()) {
                    return name.to_lowercase().contains(&search_lower);
                }
            }
            false
        })
        .take(limit)
        .map(|(id, track)| {
            let mut media_item = track.media_item.clone();
            
            if let Some(media_sources) = &track.media_sources {
                if let Some(obj) = media_item.as_object_mut() {
                    obj.insert("MediaSources".to_string(), media_sources.clone());
                }
            }
            
            let storage_dir = get_storage_dir(&app).unwrap_or_default();
            let thumbnail_path = storage_dir.join(format!("{}.thumb", id));
            if thumbnail_path.exists() {
                if let Some(obj) = media_item.as_object_mut() {
                    obj.insert("hasThumbnail".to_string(), serde_json::Value::Bool(true));
                }
            }
            
            media_item
        })
        .collect();
    
    Ok(results)
}

#[tauri::command]
pub async fn storage_get_stats(app: AppHandle) -> Result<serde_json::Value, String> {
    let storage_dir = get_storage_dir(&app).map_err(|e| e.to_string())?;
    let metadata = load_metadata(&app).map_err(|e| e.to_string())?;
    
    let mut total_size: u64 = 0;
    
    // Calculate total size of all files
    if let Ok(entries) = fs::read_dir(&storage_dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                total_size += metadata.len();
            }
        }
    }
    
    let track_count = metadata.tracks.len();
    
    Ok(serde_json::json!({
        "usage": total_size,
        "trackCount": track_count
    }))
}

#[tauri::command]
pub async fn storage_abort_downloads(
    download_manager: State<'_, DownloadManager>,
) -> Result<(), String> {
    let mut token = download_manager.cancellation_token.lock().unwrap();
    if let Some(cancel_token) = token.take() {
        cancel_token.cancel();
        println!("storage_abort_downloads: Cancelled download");
    }
    Ok(())
}
