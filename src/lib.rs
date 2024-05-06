#[no_mangle]
extern "C" fn nth_prime(n: usize) -> usize {
    // Please enjoy this horrible implementation of
    // The Sieve of Eratosthenes.
    let mut primes: Vec<usize> = Vec::new();
    let mut current = 2;
    while primes.len() < n {
        if !primes.iter().any(|prime| current % prime == 0) {
            primes.push(current);
        }
        current += 1;
    }
    primes.into_iter().last().unwrap_or(0)
}
