mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_libmpv::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            storage::storage_save_track,
            storage::storage_get_track,
            storage::storage_has_track,
            storage::storage_remove_track,
            storage::storage_get_file_path,
            storage::storage_get_thumbnail,
            storage::storage_get_track_count,
            storage::storage_clear_all,
            storage::storage_get_page,
            storage::storage_search_items,
            storage::storage_get_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
