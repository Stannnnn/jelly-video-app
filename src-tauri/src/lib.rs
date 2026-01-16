mod storage;
use tauri::{Manager, PhysicalSize, Size};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_libmpv::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(storage::DownloadManager::default())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            if let Ok(Some(monitor)) = window.current_monitor() {
                let mon_size = monitor.size();
                let scale = monitor.scale_factor();

                let config = app.config();
                let win_cfg = &config.app.windows[0];

                let def_w = win_cfg.width as u32;
                let def_h = win_cfg.height as u32;
                let min_w = win_cfg.min_width.unwrap_or(600.0) as u32;
                let min_h = win_cfg.min_height.unwrap_or(600.0) as u32;

                let avail_w = (mon_size.width as f64 * 0.9) as u32;
                let avail_h = (mon_size.height as f64 * 0.9) as u32;

                let w = def_w.min(avail_w).max(min_w);
                let h = def_h.min(avail_h).max(min_h);

                let _ = window.set_size(Size::Physical(PhysicalSize { width: w, height: h }));

                if w < def_w || h < def_h {
                    let _ = window.center();
                }
            }

            Ok(())
        })
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
            storage::storage_abort_downloads,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
