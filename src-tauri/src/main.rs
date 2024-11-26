// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;

#[tauri::command]

fn get_image_files_in_folder(folder: String) -> Vec<String> {
    let path = Path::new(&folder);
    let mut image_files = Vec::new();

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if let Some(extension) = path.extension() {
                    let ext = extension.to_str().unwrap_or("");
                    if ["png", "jpg", "jpeg", "gif"].contains(&ext) {
                        image_files.push(path.to_str().unwrap().to_string());
                    }
                }
            }
        }
    }

    image_files
}

#[tauri::command]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_image_files_in_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
