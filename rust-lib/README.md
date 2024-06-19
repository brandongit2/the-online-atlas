**note:** i was originally planing on using rust for much of the math-heavy aspects of the app. however the rust + wasm
ecosystem is too complex for me to adopt on my own. performance improvements are very likely, but the amount of
improvement is totally unclear. my thinking remains though that rust + wasm would give the following benefits:

- SIMD instructions
- much more ergonomic syntax, especially when it comes to vector math
- more intentional memory management: javascript's garbage collection can kill performance when dealing with lots of
  data. while it's possible to carefully manipulate your code to minimize memory operations, it would be a lot easier to
  do it all directly.
- also, data locality is something you could take advantage of in a non-GC language like rust.

where rust + wasm does not have a clear advantage over javascript is in straight performance. javascript engines are
incredibly optimized, and it takes quite some effort to see any straightforward performance improvement in rust on wasm.

i definitely want to revisit using rust in this app in the future. for now i'm keeping this workspace intact.
