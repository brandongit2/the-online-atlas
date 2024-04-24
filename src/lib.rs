use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen(start)]
fn run() {
	console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn foo() {
	console::log_1(&"Hello? Is anybody there?".into());
}
