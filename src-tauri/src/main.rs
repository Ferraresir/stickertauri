// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use base64;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn save_images(images: Vec<String>) {
    for (index, image) in images.iter().enumerate() {
        // Decode base64 encoded imag;
        let clean = image.replace("data:image/png;base64,", "");
        let decoded_image = base64::decode(clean).expect("Failed to decode base64 image.");
        // Example: Save image to specified folder
        let file_name = format!("image{}.png", index);
        let file_path = Path::new("c:\\Tienda de calcos 3.0\\out").join(&file_name);
        std::fs::write(file_path, &decoded_image).expect("Failed to save image to local drive.");
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_images])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
