import "jasmine";
import findFractions from"../src/fractionfinder";

describe("testcall", () => {
    it("should pass", () => {
        expect(findFractions(5, .5)).toBeDefined();
    })
});
