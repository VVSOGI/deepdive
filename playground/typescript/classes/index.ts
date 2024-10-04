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

    get getX() {
      return this.x;
    }

    get getY() {
      return this.y;
    }

    private changeToNumber(target: string) {
      if (Number.isNaN(Number(target))) {
        throw new Error("Parameters must be number or number but typeof string");
      }

      return Number(target);
    }
  }

  interface Pingable {
    x: number;
    y: number;
    z: number;
    ping(): void;
  }

  type TwoDimension = "x" | "y";

  type Coordinated<T> = {
    [P in keyof T as P extends TwoDimension ? P : never]: T[P];
  };

  class Sonar implements Coordinated<Pingable> {
    x: number;
    y: number;
    constructor(coordinated: Coordinated<Pingable>) {
      this.x = coordinated.x;
      this.y = coordinated.y;
    }
  }

  class Animal {
    test: number;
    constructor(test: number) {
      this.test = test;
    }
    move() {
      console.log("Moving along!");
    }
  }

  class Dog extends Animal {
    constructor() {
      super(10);
      console.log(this.test);
    }

    move(something?: string) {
      if (!something) {
        super.move();
      } else {
        console.log(`he saied ${something}`);
      }
    }

    woof(times: number) {
      for (let i = 0; i < times; i++) {
        console.log("woof!");
      }
    }
  }

  /**
   * Error, Array, Map 같은 객체를 extends 할 때 가끔씩
   * 자바스크립트가 prototype을 상위 객체에 할당하는 일이 있다.
   * 이러한 객체들을 extends 한다면 property를 재설정하는 것이 일반적이다.
   */
  class MsgError extends Error {
    constructor(m: string) {
      super(m);
      Object.setPrototypeOf(this, MsgError.prototype);
    }

    sayHello() {
      return "hello " + this.message;
    }
  }

  class Greeter {
    public greet() {
      console.log("Hello, " + this.getName());
    }
    protected getName() {
      return "hi";
    }
  }

  class SpecialGreeter extends Greeter {
    public howdy(some: string) {
      // OK to access protected member here
      console.log("Howdy, " + this.getName() + some);
      console.log(this.getName());
    }
  }
}
