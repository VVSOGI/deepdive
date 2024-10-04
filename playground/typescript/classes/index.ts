{
  class Point {
    private x: number;
    private y: number;

    /**
     * @constructor
     * @param {number} x - the x.
     * @param {number} y - the y.
     * @description Creates a point with separate x and y
     *
     * @param {string} xy - The xy if string. Check if x can be changed to a number.
     * @throws {Error} Throws an error if the string parameter cannot be converted to numbers.
     * @description Divide x, y values by separating the first character of a numeric string from the rest of the string.
     *
     * @param {number|string} x - The x if a number, or a string representation of both coordinates.
     * @param {number} [y=0] - The y if x is a string or not provided default to 0.
     * @throws {Error} Throws an error if the string parameter cannot be converted to numbers.
     * @example
     * // Creating a point with separate x and y
     * const point1 = new Point(5, 10);
     *
     * // Creating a point with a string representation
     * const point2 = new Point("510");
     */
    constructor(x: number, y: number);
    constructor(xy: string);
    constructor(x: string | number, y: number = 0) {
      if (typeof x === "string") {
        this.x = this.changeToNumber(x.slice(0, 1));
        this.y = this.changeToNumber(x.slice(1));
        return;
      }

      this.x = x;
      this.y = y;
    }

    getX() {
      return this.x;
    }

    getY() {
      return this.y;
    }

    private changeToNumber(target: string) {
      if (Number.isNaN(Number(target))) {
        throw new Error("Parameters must be number or number but typeof string");
      }

      return Number(target);
    }
  }
}
