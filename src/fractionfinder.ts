interface PriceResult {
    numerator: number,
    denominator: number,
    price: number
};

export default function findFractions(target: number, epsilon: number) {
    // fudge to sloppily account for floating point issues (and epsilon was already taken)
    const fudge = .001;
    const lowerBound = target - epsilon - fudge;
    const upperBound = target + epsilon + fudge;

    const results: PriceResult[] = [];

    for(let numerator = 1; numerator < 100; ++numerator) {
        for(let denominator = 1; denominator < 100; ++denominator) {
            const price = numerator / denominator;
            if (numerator === 22 && denominator === 5) {
                console.log(`${numerator}/${denominator} = ${price}`)
                console.log(`upperbound ${upperBound}`);
                console.log(`lowerbound is ${lowerBound}`);
            }
            
            if (lowerBound <= price && price <= upperBound) {
                results.push({numerator, denominator, price});
            }
        }
    }

    return results;
}
