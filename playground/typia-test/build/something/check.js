"use strict";
(() => {
  // node_modules/typia/lib/index.mjs
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var lib$1 = { exports: {} };
  var util$1 = {};
  var types$4 = {
    ROOT: 0,
    GROUP: 1,
    POSITION: 2,
    SET: 3,
    RANGE: 4,
    REPETITION: 5,
    REFERENCE: 6,
    CHAR: 7
  };
  var sets$1 = {};
  var types$3 = types$4;
  var INTS = () => [{ type: types$3.RANGE, from: 48, to: 57 }];
  var WORDS = () => {
    return [
      { type: types$3.CHAR, value: 95 },
      { type: types$3.RANGE, from: 97, to: 122 },
      { type: types$3.RANGE, from: 65, to: 90 }
    ].concat(INTS());
  };
  var WHITESPACE = () => {
    return [
      { type: types$3.CHAR, value: 9 },
      { type: types$3.CHAR, value: 10 },
      { type: types$3.CHAR, value: 11 },
      { type: types$3.CHAR, value: 12 },
      { type: types$3.CHAR, value: 13 },
      { type: types$3.CHAR, value: 32 },
      { type: types$3.CHAR, value: 160 },
      { type: types$3.CHAR, value: 5760 },
      { type: types$3.RANGE, from: 8192, to: 8202 },
      { type: types$3.CHAR, value: 8232 },
      { type: types$3.CHAR, value: 8233 },
      { type: types$3.CHAR, value: 8239 },
      { type: types$3.CHAR, value: 8287 },
      { type: types$3.CHAR, value: 12288 },
      { type: types$3.CHAR, value: 65279 }
    ];
  };
  var NOTANYCHAR = () => {
    return [
      { type: types$3.CHAR, value: 10 },
      { type: types$3.CHAR, value: 13 },
      { type: types$3.CHAR, value: 8232 },
      { type: types$3.CHAR, value: 8233 }
    ];
  };
  sets$1.words = () => ({ type: types$3.SET, set: WORDS(), not: false });
  sets$1.notWords = () => ({ type: types$3.SET, set: WORDS(), not: true });
  sets$1.ints = () => ({ type: types$3.SET, set: INTS(), not: false });
  sets$1.notInts = () => ({ type: types$3.SET, set: INTS(), not: true });
  sets$1.whitespace = () => ({ type: types$3.SET, set: WHITESPACE(), not: false });
  sets$1.notWhitespace = () => ({ type: types$3.SET, set: WHITESPACE(), not: true });
  sets$1.anyChar = () => ({ type: types$3.SET, set: NOTANYCHAR(), not: true });
  (function(exports) {
    const types2 = types$4;
    const sets2 = sets$1;
    const CTRL = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^ ?";
    const SLSH = { "0": 0, "t": 9, "n": 10, "v": 11, "f": 12, "r": 13 };
    exports.strToChars = function(str) {
      var chars_regex = /(\[\\b\])|(\\)?\\(?:u([A-F0-9]{4})|x([A-F0-9]{2})|(0?[0-7]{2})|c([@A-Z[\\\]^?])|([0tnvfr]))/g;
      str = str.replace(chars_regex, function(s, b, lbs, a16, b16, c8, dctrl, eslsh) {
        if (lbs) {
          return s;
        }
        var code = b ? 8 : a16 ? parseInt(a16, 16) : b16 ? parseInt(b16, 16) : c8 ? parseInt(c8, 8) : dctrl ? CTRL.indexOf(dctrl) : SLSH[eslsh];
        var c = String.fromCharCode(code);
        if (/[[\]{}^$.|?*+()]/.test(c)) {
          c = "\\" + c;
        }
        return c;
      });
      return str;
    };
    exports.tokenizeClass = (str, regexpStr) => {
      var tokens = [];
      var regexp = /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(?:\\)?([^\]]))|(\])|(?:\\)?([^])/g;
      var rs, c;
      while ((rs = regexp.exec(str)) != null) {
        if (rs[1]) {
          tokens.push(sets2.words());
        } else if (rs[2]) {
          tokens.push(sets2.ints());
        } else if (rs[3]) {
          tokens.push(sets2.whitespace());
        } else if (rs[4]) {
          tokens.push(sets2.notWords());
        } else if (rs[5]) {
          tokens.push(sets2.notInts());
        } else if (rs[6]) {
          tokens.push(sets2.notWhitespace());
        } else if (rs[7]) {
          tokens.push({
            type: types2.RANGE,
            from: (rs[8] || rs[9]).charCodeAt(0),
            to: rs[10].charCodeAt(0)
          });
        } else if (c = rs[12]) {
          tokens.push({
            type: types2.CHAR,
            value: c.charCodeAt(0)
          });
        } else {
          return [tokens, regexp.lastIndex];
        }
      }
      exports.error(regexpStr, "Unterminated character class");
    };
    exports.error = (regexp, msg) => {
      throw new SyntaxError("Invalid regular expression: /" + regexp + "/: " + msg);
    };
  })(util$1);
  var positions$1 = {};
  var types$2 = types$4;
  positions$1.wordBoundary = () => ({ type: types$2.POSITION, value: "b" });
  positions$1.nonWordBoundary = () => ({ type: types$2.POSITION, value: "B" });
  positions$1.begin = () => ({ type: types$2.POSITION, value: "^" });
  positions$1.end = () => ({ type: types$2.POSITION, value: "$" });
  var util = util$1;
  var types$1 = types$4;
  var sets = sets$1;
  var positions = positions$1;
  lib$1.exports = (regexpStr) => {
    var i = 0, l, c, start = { type: types$1.ROOT, stack: [] }, lastGroup = start, last = start.stack, groupStack = [];
    var repeatErr = (i2) => {
      util.error(regexpStr, `Nothing to repeat at column ${i2 - 1}`);
    };
    var str = util.strToChars(regexpStr);
    l = str.length;
    while (i < l) {
      c = str[i++];
      switch (c) {
        // Handle escaped characters, inclues a few sets.
        case "\\":
          c = str[i++];
          switch (c) {
            case "b":
              last.push(positions.wordBoundary());
              break;
            case "B":
              last.push(positions.nonWordBoundary());
              break;
            case "w":
              last.push(sets.words());
              break;
            case "W":
              last.push(sets.notWords());
              break;
            case "d":
              last.push(sets.ints());
              break;
            case "D":
              last.push(sets.notInts());
              break;
            case "s":
              last.push(sets.whitespace());
              break;
            case "S":
              last.push(sets.notWhitespace());
              break;
            default:
              if (/\d/.test(c)) {
                last.push({ type: types$1.REFERENCE, value: parseInt(c, 10) });
              } else {
                last.push({ type: types$1.CHAR, value: c.charCodeAt(0) });
              }
          }
          break;
        // Positionals.
        case "^":
          last.push(positions.begin());
          break;
        case "$":
          last.push(positions.end());
          break;
        // Handle custom sets.
        case "[":
          var not;
          if (str[i] === "^") {
            not = true;
            i++;
          } else {
            not = false;
          }
          var classTokens = util.tokenizeClass(str.slice(i), regexpStr);
          i += classTokens[1];
          last.push({
            type: types$1.SET,
            set: classTokens[0],
            not
          });
          break;
        // Class of any character except \n.
        case ".":
          last.push(sets.anyChar());
          break;
        // Push group onto stack.
        case "(":
          var group = {
            type: types$1.GROUP,
            stack: [],
            remember: true
          };
          c = str[i];
          if (c === "?") {
            c = str[i + 1];
            i += 2;
            if (c === "=") {
              group.followedBy = true;
            } else if (c === "!") {
              group.notFollowedBy = true;
            } else if (c !== ":") {
              util.error(
                regexpStr,
                `Invalid group, character '${c}' after '?' at column ${i - 1}`
              );
            }
            group.remember = false;
          }
          last.push(group);
          groupStack.push(lastGroup);
          lastGroup = group;
          last = group.stack;
          break;
        // Pop group out of stack.
        case ")":
          if (groupStack.length === 0) {
            util.error(regexpStr, `Unmatched ) at column ${i - 1}`);
          }
          lastGroup = groupStack.pop();
          last = lastGroup.options ? lastGroup.options[lastGroup.options.length - 1] : lastGroup.stack;
          break;
        // Use pipe character to give more choices.
        case "|":
          if (!lastGroup.options) {
            lastGroup.options = [lastGroup.stack];
            delete lastGroup.stack;
          }
          var stack = [];
          lastGroup.options.push(stack);
          last = stack;
          break;
        // Repetition.
        // For every repetition, remove last element from last stack
        // then insert back a RANGE object.
        // This design is chosen because there could be more than
        // one repetition symbols in a regex i.e. `a?+{2,3}`.
        case "{":
          var rs = /^(\d+)(,(\d+)?)?\}/.exec(str.slice(i)), min, max;
          if (rs !== null) {
            if (last.length === 0) {
              repeatErr(i);
            }
            min = parseInt(rs[1], 10);
            max = rs[2] ? rs[3] ? parseInt(rs[3], 10) : Infinity : min;
            i += rs[0].length;
            last.push({
              type: types$1.REPETITION,
              min,
              max,
              value: last.pop()
            });
          } else {
            last.push({
              type: types$1.CHAR,
              value: 123
            });
          }
          break;
        case "?":
          if (last.length === 0) {
            repeatErr(i);
          }
          last.push({
            type: types$1.REPETITION,
            min: 0,
            max: 1,
            value: last.pop()
          });
          break;
        case "+":
          if (last.length === 0) {
            repeatErr(i);
          }
          last.push({
            type: types$1.REPETITION,
            min: 1,
            max: Infinity,
            value: last.pop()
          });
          break;
        case "*":
          if (last.length === 0) {
            repeatErr(i);
          }
          last.push({
            type: types$1.REPETITION,
            min: 0,
            max: Infinity,
            value: last.pop()
          });
          break;
        // Default is a character that is not `\[](){}?+*^$`.
        default:
          last.push({
            type: types$1.CHAR,
            value: c.charCodeAt(0)
          });
      }
    }
    if (groupStack.length !== 0) {
      util.error(regexpStr, "Unterminated group");
    }
    return start;
  };
  lib$1.exports.types = types$1;
  var libExports = lib$1.exports;
  var SubRange = class _SubRange {
    constructor(low, high) {
      this.low = low;
      this.high = high;
      this.length = 1 + high - low;
    }
    overlaps(range) {
      return !(this.high < range.low || this.low > range.high);
    }
    touches(range) {
      return !(this.high + 1 < range.low || this.low - 1 > range.high);
    }
    // Returns inclusive combination of SubRanges as a SubRange.
    add(range) {
      return new _SubRange(
        Math.min(this.low, range.low),
        Math.max(this.high, range.high)
      );
    }
    // Returns subtraction of SubRanges as an array of SubRanges.
    // (There's a case where subtraction divides it in 2)
    subtract(range) {
      if (range.low <= this.low && range.high >= this.high) {
        return [];
      } else if (range.low > this.low && range.high < this.high) {
        return [
          new _SubRange(this.low, range.low - 1),
          new _SubRange(range.high + 1, this.high)
        ];
      } else if (range.low <= this.low) {
        return [new _SubRange(range.high + 1, this.high)];
      } else {
        return [new _SubRange(this.low, range.low - 1)];
      }
    }
    toString() {
      return this.low == this.high ? this.low.toString() : this.low + "-" + this.high;
    }
  };
  var DRange$1 = class DRange {
    constructor(a, b) {
      this.ranges = [];
      this.length = 0;
      if (a != null) this.add(a, b);
    }
    _update_length() {
      this.length = this.ranges.reduce((previous, range) => {
        return previous + range.length;
      }, 0);
    }
    add(a, b) {
      var _add = (subrange) => {
        var i = 0;
        while (i < this.ranges.length && !subrange.touches(this.ranges[i])) {
          i++;
        }
        var newRanges = this.ranges.slice(0, i);
        while (i < this.ranges.length && subrange.touches(this.ranges[i])) {
          subrange = subrange.add(this.ranges[i]);
          i++;
        }
        newRanges.push(subrange);
        this.ranges = newRanges.concat(this.ranges.slice(i));
        this._update_length();
      };
      if (a instanceof DRange) {
        a.ranges.forEach(_add);
      } else {
        if (b == null) b = a;
        _add(new SubRange(a, b));
      }
      return this;
    }
    subtract(a, b) {
      var _subtract = (subrange) => {
        var i = 0;
        while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
          i++;
        }
        var newRanges = this.ranges.slice(0, i);
        while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
          newRanges = newRanges.concat(this.ranges[i].subtract(subrange));
          i++;
        }
        this.ranges = newRanges.concat(this.ranges.slice(i));
        this._update_length();
      };
      if (a instanceof DRange) {
        a.ranges.forEach(_subtract);
      } else {
        if (b == null) b = a;
        _subtract(new SubRange(a, b));
      }
      return this;
    }
    intersect(a, b) {
      var newRanges = [];
      var _intersect = (subrange) => {
        var i = 0;
        while (i < this.ranges.length && !subrange.overlaps(this.ranges[i])) {
          i++;
        }
        while (i < this.ranges.length && subrange.overlaps(this.ranges[i])) {
          var low = Math.max(this.ranges[i].low, subrange.low);
          var high = Math.min(this.ranges[i].high, subrange.high);
          newRanges.push(new SubRange(low, high));
          i++;
        }
      };
      if (a instanceof DRange) {
        a.ranges.forEach(_intersect);
      } else {
        if (b == null) b = a;
        _intersect(new SubRange(a, b));
      }
      this.ranges = newRanges;
      this._update_length();
      return this;
    }
    index(index2) {
      var i = 0;
      while (i < this.ranges.length && this.ranges[i].length <= index2) {
        index2 -= this.ranges[i].length;
        i++;
      }
      return this.ranges[i].low + index2;
    }
    toString() {
      return "[ " + this.ranges.join(", ") + " ]";
    }
    clone() {
      return new DRange(this);
    }
    numbers() {
      return this.ranges.reduce((result, subrange) => {
        var i = subrange.low;
        while (i <= subrange.high) {
          result.push(i);
          i++;
        }
        return result;
      }, []);
    }
    subranges() {
      return this.ranges.map((subrange) => ({
        low: subrange.low,
        high: subrange.high,
        length: 1 + subrange.high - subrange.low
      }));
    }
  };
  var lib = DRange$1;
  var ret = libExports;
  var DRange2 = lib;
  var types = ret.types;
  var randexp = class RandExp {
    /**
     * @constructor
     * @param {RegExp|String} regexp
     * @param {String} m
     */
    constructor(regexp, m) {
      this._setDefaults(regexp);
      if (regexp instanceof RegExp) {
        this.ignoreCase = regexp.ignoreCase;
        this.multiline = regexp.multiline;
        regexp = regexp.source;
      } else if (typeof regexp === "string") {
        this.ignoreCase = m && m.indexOf("i") !== -1;
        this.multiline = m && m.indexOf("m") !== -1;
      } else {
        throw new Error("Expected a regexp or string");
      }
      this.tokens = ret(regexp);
    }
    /**
     * Checks if some custom properties have been set for this regexp.
     *
     * @param {RandExp} randexp
     * @param {RegExp} regexp
     */
    _setDefaults(regexp) {
      this.max = regexp.max != null ? regexp.max : RandExp.prototype.max != null ? RandExp.prototype.max : 100;
      this.defaultRange = regexp.defaultRange ? regexp.defaultRange : this.defaultRange.clone();
      if (regexp.randInt) {
        this.randInt = regexp.randInt;
      }
    }
    /**
     * Generates the random string.
     *
     * @return {String}
     */
    gen() {
      return this._gen(this.tokens, []);
    }
    /**
     * Generate random string modeled after given tokens.
     *
     * @param {Object} token
     * @param {Array.<String>} groups
     * @return {String}
     */
    _gen(token, groups) {
      var stack, str, n, i, l;
      switch (token.type) {
        case types.ROOT:
        case types.GROUP:
          if (token.followedBy || token.notFollowedBy) {
            return "";
          }
          if (token.remember && token.groupNumber === void 0) {
            token.groupNumber = groups.push(null) - 1;
          }
          stack = token.options ? this._randSelect(token.options) : token.stack;
          str = "";
          for (i = 0, l = stack.length; i < l; i++) {
            str += this._gen(stack[i], groups);
          }
          if (token.remember) {
            groups[token.groupNumber] = str;
          }
          return str;
        case types.POSITION:
          return "";
        case types.SET:
          var expandedSet = this._expand(token);
          if (!expandedSet.length) {
            return "";
          }
          return String.fromCharCode(this._randSelect(expandedSet));
        case types.REPETITION:
          n = this.randInt(
            token.min,
            token.max === Infinity ? token.min + this.max : token.max
          );
          str = "";
          for (i = 0; i < n; i++) {
            str += this._gen(token.value, groups);
          }
          return str;
        case types.REFERENCE:
          return groups[token.value - 1] || "";
        case types.CHAR:
          var code = this.ignoreCase && this._randBool() ? this._toOtherCase(token.value) : token.value;
          return String.fromCharCode(code);
      }
    }
    /**
     * If code is alphabetic, converts to other case.
     * If not alphabetic, returns back code.
     *
     * @param {Number} code
     * @return {Number}
     */
    _toOtherCase(code) {
      return code + (97 <= code && code <= 122 ? -32 : 65 <= code && code <= 90 ? 32 : 0);
    }
    /**
     * Randomly returns a true or false value.
     *
     * @return {Boolean}
     */
    _randBool() {
      return !this.randInt(0, 1);
    }
    /**
     * Randomly selects and returns a value from the array.
     *
     * @param {Array.<Object>} arr
     * @return {Object}
     */
    _randSelect(arr) {
      if (arr instanceof DRange2) {
        return arr.index(this.randInt(0, arr.length - 1));
      }
      return arr[this.randInt(0, arr.length - 1)];
    }
    /**
     * expands a token to a DiscontinuousRange of characters which has a
     * length and an index function (for random selecting)
     *
     * @param {Object} token
     * @return {DiscontinuousRange}
     */
    _expand(token) {
      if (token.type === ret.types.CHAR) {
        return new DRange2(token.value);
      } else if (token.type === ret.types.RANGE) {
        return new DRange2(token.from, token.to);
      } else {
        let drange = new DRange2();
        for (let i = 0; i < token.set.length; i++) {
          let subrange = this._expand(token.set[i]);
          drange.add(subrange);
          if (this.ignoreCase) {
            for (let j = 0; j < subrange.length; j++) {
              let code = subrange.index(j);
              let otherCaseCode = this._toOtherCase(code);
              if (code !== otherCaseCode) {
                drange.add(otherCaseCode);
              }
            }
          }
        }
        if (token.not) {
          return this.defaultRange.clone().subtract(drange);
        } else {
          return this.defaultRange.clone().intersect(drange);
        }
      }
    }
    /**
     * Randomly generates and returns a number between a and b (inclusive).
     *
     * @param {Number} a
     * @param {Number} b
     * @return {Number}
     */
    randInt(a, b) {
      return a + Math.floor(Math.random() * (1 + b - a));
    }
    /**
     * Default range of characters to generate from.
     */
    get defaultRange() {
      return this._range = this._range || new DRange2(32, 126);
    }
    set defaultRange(range) {
      this._range = range;
    }
    /**
     *
     * Enables use of randexp with a shorter call.
     *
     * @param {RegExp|String| regexp}
     * @param {String} m
     * @return {String}
     */
    static randexp(regexp, m) {
      var randexp2;
      if (typeof regexp === "string") {
        regexp = new RegExp(regexp, m);
      }
      if (regexp._randexp === void 0) {
        randexp2 = new RandExp(regexp, m);
        regexp._randexp = randexp2;
      } else {
        randexp2 = regexp._randexp;
        randexp2._setDefaults(regexp);
      }
      return randexp2.gen();
    }
    /**
     * Enables sugary /regexp/.gen syntax.
     */
    static sugar() {
      RegExp.prototype.gen = function() {
        return RandExp.randexp(this);
      };
    }
  };
  var RandExp2 = /* @__PURE__ */ getDefaultExportFromCjs(randexp);
  var ALPHABETS = "abcdefghijklmnopqrstuvwxyz";
  var boolean$4 = () => Math.random() < 0.5;
  var integer = (min, max) => {
    min ??= 0;
    max ??= 100;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  var bigint$4 = (min, max) => BigInt(integer(Number(min ?? BigInt(0)), Number(max ?? BigInt(100))));
  var number$4 = (min, max) => {
    min ??= 0;
    max ??= 100;
    return Math.random() * (max - min) + min;
  };
  var string$4 = (length2) => new Array(length2 ?? integer(5, 10)).fill(0).map(() => ALPHABETS[integer(0, ALPHABETS.length - 1)]).join("");
  var array$2 = (closure, count, unique) => {
    count ??= length();
    unique ??= false;
    if (unique === false)
      return new Array(count ?? length()).fill(0).map((_e, index2) => closure(index2));
    else {
      const set = /* @__PURE__ */ new Set();
      while (set.size < count)
        set.add(closure(set.size));
      return Array.from(set);
    }
  };
  var pick = (array2) => array2[integer(0, array2.length - 1)];
  var length = () => integer(0, 3);
  var pattern = (regex2) => {
    const r = new RandExp2(regex2);
    for (let i = 0; i < 10; ++i) {
      const str = r.gen();
      if (regex2.test(str))
        return str;
    }
    return r.gen();
  };
  var byte = () => "vt7ekz4lIoNTTS9sDQYdWKharxIFAR54+z/umIxSgUM=";
  var password = () => string$4(integer(4, 16));
  var regex = () => "/^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/";
  var uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
  var email = () => `${string$4(10)}@${string$4(10)}.${string$4(3)}`;
  var hostname = () => `${string$4(10)}.${string$4(3)}`;
  var idnEmail = () => email();
  var idnHostname = () => hostname();
  var iri = () => url();
  var iriReference = () => url();
  var ipv4 = () => array$2(() => integer(0, 255), 4).join(".");
  var ipv6 = () => array$2(() => integer(0, 65535).toString(16), 8).join(":");
  var uri = () => url();
  var uriReference = () => url();
  var uriTemplate = () => url();
  var url = () => `https://${string$4(10)}.${string$4(3)}`;
  var datetime = (min, max) => new Date(number$4(min ?? Date.now() - 30 * DAY, max ?? Date.now() + 7 * DAY)).toISOString();
  var date = (min, max) => new Date(number$4(min ?? 0, max ?? Date.now() * 2)).toISOString().substring(0, 10);
  var time = () => new Date(number$4(0, DAY)).toISOString().substring(11);
  var duration = () => {
    const period = durate([
      ["Y", integer(0, 100)],
      ["M", integer(0, 12)],
      ["D", integer(0, 31)]
    ]);
    const time2 = durate([
      ["H", integer(0, 24)],
      ["M", integer(0, 60)],
      ["S", integer(0, 60)]
    ]);
    if (period.length + time2.length === 0)
      return "PT0S";
    return `P${period}${time2.length ? "T" : ""}${time2}`;
  };
  var jsonPointer = () => `/components/schemas/${string$4(10)}`;
  var relativeJsonPointer = () => `${integer(0, 10)}#`;
  var DAY = 864e5;
  var durate = (elements) => elements.filter(([_unit, value]) => value !== 0).map(([unit, value]) => `${value}${unit}`).join("");
  var RandomGenerator = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    array: array$2,
    bigint: bigint$4,
    boolean: boolean$4,
    byte,
    date,
    datetime,
    duration,
    email,
    hostname,
    idnEmail,
    idnHostname,
    integer,
    ipv4,
    ipv6,
    iri,
    iriReference,
    jsonPointer,
    length,
    number: number$4,
    password,
    pattern,
    pick,
    regex,
    relativeJsonPointer,
    string: string$4,
    time,
    uri,
    uriReference,
    uriTemplate,
    url,
    uuid
  });
  var $every = (array2, pred) => {
    let error = null;
    for (let i = 0; i < array2.length; ++i)
      if (null !== (error = pred(array2[i], i)))
        return error;
    return null;
  };
  var TypeGuardError = class extends Error {
    method;
    path;
    expected;
    value;
    fake_expected_typed_value_;
    constructor(props) {
      super(props.message || `Error on ${props.method}(): invalid type${props.path ? ` on ${props.path}` : ""}, expect to be ${props.expected}`);
      const proto = new.target.prototype;
      if (Object.setPrototypeOf)
        Object.setPrototypeOf(this, proto);
      else
        this.__proto__ = proto;
      this.method = props.method;
      this.path = props.path;
      this.expected = props.expected;
      this.value = props.value;
    }
  };
  var $guard = (method) => (exceptionable, props, factory) => {
    if (exceptionable === true)
      throw (factory ?? ((props2) => new TypeGuardError(props2)))({
        method,
        path: props.path,
        expected: props.expected,
        value: props.value
      });
    return false;
  };
  var $join = (str) => variable(str) ? `.${str}` : `[${JSON.stringify(str)}]`;
  var variable = (str) => reserved(str) === false && /^[a-zA-Z_$][a-zA-Z_$0-9]*$/g.test(str);
  var reserved = (str) => RESERVED.has(str);
  var RESERVED = /* @__PURE__ */ new Set([
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with"
  ]);
  var $report = (array2) => {
    const reportable = (path) => {
      if (array2.length === 0)
        return true;
      const last = array2[array2.length - 1].path;
      return path.length > last.length || last.substring(0, path.length) !== path;
    };
    return (exceptable, error) => {
      if (exceptable && reportable(error.path))
        array2.push(error);
      return false;
    };
  };
  var $is_between = (value, minimum, maximum) => minimum <= value && value <= maximum;
  var $is_bigint_string = (str) => {
    try {
      BigInt(str);
      return true;
    } catch {
      return false;
    }
  };
  var is$1 = () => ({
    is_between: $is_between,
    is_bigint_string: $is_bigint_string
  });
  var functionalAssert = () => ({
    errorFactory: (p) => new TypeGuardError(p)
  });
  var $number = (value) => {
    if (isFinite(value) === false)
      throw new TypeGuardError({
        method: "typia.json.stringify",
        expected: "number",
        value,
        message: "Error on typia.json.stringify(): infinite or not a number."
      });
    return value;
  };
  var $rest = (str) => {
    return str.length === 2 ? "" : "," + str.substring(1, str.length - 1);
  };
  var $string = (str) => {
    const len = str.length;
    let result = "";
    let last = -1;
    let point = 255;
    for (var i = 0; i < len; i++) {
      point = str.charCodeAt(i);
      if (point < 32) {
        return JSON.stringify(str);
      }
      if (point >= 55296 && point <= 57343) {
        return JSON.stringify(str);
      }
      if (point === 34 || // '"'
      point === 92) {
        last === -1 && (last = 0);
        result += str.slice(last, i) + "\\";
        last = i;
      }
    }
    return last === -1 && '"' + str + '"' || '"' + result + str.slice(last) + '"';
  };
  var $tail = (str) => str[str.length - 1] === "," ? str.substring(0, str.length - 1) : str;
  var $throws = (method) => (props) => {
    throw new TypeGuardError({
      ...props,
      method: `typia.${method}`
    });
  };
  var stringify$1 = (method) => ({
    ...is$1(),
    number: $number,
    string: $string,
    tail: $tail,
    rest: $rest,
    throws: $throws(`json.${method}`)
  });
  var boolean$3 = (input) => input instanceof File ? input : input === null ? void 0 : input === "null" ? null : input.length === 0 ? true : input === "true" || input === "1" ? true : input === "false" || input === "0" ? false : input;
  var number$3 = (input) => input instanceof File ? input : !!input?.length ? input === "null" ? null : toNumber$3(input) : void 0;
  var bigint$3 = (input) => input instanceof File ? input : !!input?.length ? input === "null" ? null : toBigint$3(input) : void 0;
  var string$3 = (input) => input instanceof File ? input : input === null ? void 0 : input === "null" ? null : input;
  var array$1 = (input, alternative) => input.length ? input : alternative;
  var blob = (input) => input instanceof Blob ? input : input === null ? void 0 : input === "null" ? null : input;
  var file = (input) => input instanceof File ? input : input === null ? void 0 : input === "null" ? null : input;
  var toNumber$3 = (str) => {
    const value = Number(str);
    return isNaN(value) ? str : value;
  };
  var toBigint$3 = (str) => {
    try {
      return BigInt(str);
    } catch {
      return str;
    }
  };
  var $FormDataReader = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    array: array$1,
    bigint: bigint$3,
    blob,
    boolean: boolean$3,
    file,
    number: number$3,
    string: string$3
  });
  var boolean$2 = (value) => value !== void 0 ? value === "true" ? true : value === "false" ? false : value : void 0;
  var bigint$2 = (value) => value !== void 0 ? toBigint$2(value) : void 0;
  var number$2 = (value) => value !== void 0 ? toNumber$2(value) : void 0;
  var string$2 = (value) => value;
  var toBigint$2 = (str) => {
    try {
      return BigInt(str);
    } catch {
      return str;
    }
  };
  var toNumber$2 = (str) => {
    const value = Number(str);
    return isNaN(value) ? str : value;
  };
  var $HeadersReader = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    bigint: bigint$2,
    boolean: boolean$2,
    number: number$2,
    string: string$2
  });
  var boolean$1 = (value) => value !== "null" ? value === "true" || value === "1" ? true : value === "false" || value === "0" ? false : value : null;
  var bigint$1 = (value) => value !== "null" ? toBigint$1(value) : null;
  var number$1 = (value) => value !== "null" ? toNumber$1(value) : null;
  var string$1 = (value) => value !== "null" ? value : null;
  var toNumber$1 = (str) => {
    const value = Number(str);
    return isNaN(value) ? str : value;
  };
  var toBigint$1 = (str) => {
    try {
      return BigInt(str);
    } catch {
      return str;
    }
  };
  var $ParameterReader = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    bigint: bigint$1,
    boolean: boolean$1,
    number: number$1,
    string: string$1
  });
  var boolean = (str) => str === null ? void 0 : str === "null" ? null : str.length === 0 ? true : str === "true" || str === "1" ? true : str === "false" || str === "0" ? false : str;
  var number = (str) => !!str?.length ? str === "null" ? null : toNumber(str) : void 0;
  var bigint = (str) => !!str?.length ? str === "null" ? null : toBigint(str) : void 0;
  var string = (str) => str === null ? void 0 : str === "null" ? null : str;
  var params = (input) => {
    if (typeof input === "string") {
      const index2 = input.indexOf("?");
      input = index2 === -1 ? "" : input.substring(index2 + 1);
      return new URLSearchParams(input);
    }
    return input;
  };
  var array = (input, alternative) => input.length ? input : alternative;
  var toNumber = (str) => {
    const value = Number(str);
    return isNaN(value) ? str : value;
  };
  var toBigint = (str) => {
    try {
      return BigInt(str);
    } catch {
      return str;
    }
  };
  var $QueryReader = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    array,
    bigint,
    boolean,
    number,
    params,
    string
  });
  var formData$1 = () => $FormDataReader;
  var headers$1 = () => $HeadersReader;
  var parameter$1 = () => $ParameterReader;
  var query$1 = () => $QueryReader;
  var capitalize = (str) => str.length ? str[0].toUpperCase() + str.slice(1).toLowerCase() : str;
  function snake$2(str) {
    if (str.length === 0)
      return str;
    let prefix = "";
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "_")
        prefix += "_";
      else
        break;
    }
    if (prefix.length !== 0)
      str = str.substring(prefix.length);
    const out = (s) => `${prefix}${s}`;
    const items = str.split("_");
    if (items.length > 1)
      return out(items.map((s) => s.toLowerCase()).join("_"));
    const indexes = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (65 <= code && code <= 90)
        indexes.push(i);
    }
    for (let i = indexes.length - 1; i > 0; --i) {
      const now = indexes[i];
      const prev = indexes[i - 1];
      if (now - prev === 1)
        indexes.splice(i, 1);
    }
    if (indexes.length !== 0 && indexes[0] === 0)
      indexes.splice(0, 1);
    if (indexes.length === 0)
      return str.toLowerCase();
    let ret2 = "";
    for (let i = 0; i < indexes.length; i++) {
      const first = i === 0 ? 0 : indexes[i - 1];
      const last = indexes[i];
      ret2 += str.substring(first, last).toLowerCase();
      ret2 += "_";
    }
    ret2 += str.substring(indexes[indexes.length - 1]).toLowerCase();
    return out(ret2);
  }
  var camel$2 = (str) => unsnake({
    plain: (str2) => str2.length ? str2 === str2.toUpperCase() ? str2.toLocaleLowerCase() : `${str2[0].toLowerCase()}${str2.substring(1)}` : str2,
    snake: (str2, i) => i === 0 ? str2.toLowerCase() : capitalize(str2.toLowerCase())
  })(str);
  var pascal$2 = (str) => unsnake({
    plain: (str2) => str2.length ? `${str2[0].toUpperCase()}${str2.substring(1)}` : str2,
    snake: capitalize
  })(str);
  var unsnake = (props) => (str) => {
    let prefix = "";
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "_")
        prefix += "_";
      else
        break;
    }
    if (prefix.length !== 0)
      str = str.substring(prefix.length);
    const out = (s) => `${prefix}${s}`;
    if (str.length === 0)
      return out("");
    const items = str.split("_").filter((s) => s.length !== 0);
    return items.length === 0 ? out("") : items.length === 1 ? out(props.plain(items[0])) : out(items.map(props.snake).join(""));
  };
  var $convention = (rename) => {
    const main = (input) => {
      if (typeof input === "object")
        if (input === null)
          return null;
        else if (Array.isArray(input))
          return input.map(main);
        else if (input instanceof Boolean || input instanceof BigInt || input instanceof Number || input instanceof String)
          return input.valueOf();
        else if (input instanceof Date)
          return new Date(input);
        else if (input instanceof Uint8Array || input instanceof Uint8ClampedArray || input instanceof Uint16Array || input instanceof Uint32Array || input instanceof BigUint64Array || input instanceof Int8Array || input instanceof Int16Array || input instanceof Int32Array || input instanceof BigInt64Array || input instanceof Float32Array || input instanceof Float64Array || input instanceof DataView)
          return input;
        else
          return object(input);
      return input;
    };
    const object = (input) => Object.fromEntries(Object.entries(input).map(([key, value]) => [rename(key), main(value)]));
    return main;
  };
  var camel$1 = (method) => ({
    ...base(method),
    any: $convention(camel$2)
  });
  var pascal$1 = (method) => ({
    ...base(method),
    any: $convention(pascal$2)
  });
  var snake$1 = (method) => ({
    ...base(method),
    any: $convention(snake$2)
  });
  var base = (method) => ({
    ...is$1(),
    throws: $throws(`notations.${method}`)
  });
  var $clone = (value) => $cloneMain(value);
  var $cloneMain = (value) => {
    if (value === void 0)
      return void 0;
    else if (typeof value === "object")
      if (value === null)
        return null;
      else if (Array.isArray(value))
        return value.map($cloneMain);
      else if (value instanceof Date)
        return new Date(value);
      else if (value instanceof Uint8Array)
        return new Uint8Array(value);
      else if (value instanceof Uint8ClampedArray)
        return new Uint8ClampedArray(value);
      else if (value instanceof Uint16Array)
        return new Uint16Array(value);
      else if (value instanceof Uint32Array)
        return new Uint32Array(value);
      else if (value instanceof BigUint64Array)
        return new BigUint64Array(value);
      else if (value instanceof Int8Array)
        return new Int8Array(value);
      else if (value instanceof Int16Array)
        return new Int16Array(value);
      else if (value instanceof Int32Array)
        return new Int32Array(value);
      else if (value instanceof BigInt64Array)
        return new BigInt64Array(value);
      else if (value instanceof Float32Array)
        return new Float32Array(value);
      else if (value instanceof Float64Array)
        return new Float64Array(value);
      else if (value instanceof ArrayBuffer)
        return value.slice(0);
      else if (value instanceof SharedArrayBuffer)
        return value.slice(0);
      else if (value instanceof DataView)
        return new DataView(value.buffer.slice(0));
      else if (typeof File !== "undefined" && value instanceof File)
        return new File([value], value.name, { type: value.type });
      else if (typeof Blob !== "undefined" && value instanceof Blob)
        return new Blob([value], { type: value.type });
      else if (value instanceof Set)
        return new Set([...value].map($cloneMain));
      else if (value instanceof Map)
        return new Map([...value].map(([k, v]) => [$cloneMain(k), $cloneMain(v)]));
      else if (value instanceof WeakSet || value instanceof WeakMap)
        throw new Error("WeakSet and WeakMap are not supported");
      else if (value.valueOf() !== value)
        return $cloneMain(value.valueOf());
      else
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, $cloneMain(v)]).filter(([, v]) => v !== void 0));
    else if (typeof value === "function")
      return void 0;
    return value;
  };
  var $any = (val) => $clone(val);
  var clone$1 = (method) => ({
    ...is$1(),
    throws: $throws(`misc.${method}`),
    any: $any
  });
  var prune$1 = (method) => ({
    ...is$1(),
    throws: $throws(`misc.${method}`)
  });
  var Singleton = class {
    closure_;
    value_;
    constructor(closure) {
      this.closure_ = closure;
      this.value_ = NOT_MOUNTED_YET;
    }
    get(...args) {
      if (this.value_ === NOT_MOUNTED_YET)
        this.value_ = this.closure_(...args);
      return this.value_;
    }
  };
  var NOT_MOUNTED_YET = {};
  var $ProtobufReader = class {
    /**
     * Read buffer
     */
    buf;
    /**
     * Read buffer pointer.
     */
    ptr;
    /**
     * DataView for buffer.
     */
    view;
    constructor(buf) {
      this.buf = buf;
      this.ptr = 0;
      this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    index() {
      return this.ptr;
    }
    size() {
      return this.buf.length;
    }
    uint32() {
      return this.varint32();
    }
    int32() {
      return this.varint32();
    }
    sint32() {
      const value = this.varint32();
      return value >>> 1 ^ -(value & 1);
    }
    uint64() {
      return this.varint64();
    }
    int64() {
      return this.varint64();
    }
    sint64() {
      const value = this.varint64();
      return value >> BigInt(1) ^ -(value & BigInt(1));
    }
    bool() {
      return this.varint32() !== 0;
    }
    float() {
      const value = this.view.getFloat32(this.ptr, true);
      this.ptr += 4;
      return value;
    }
    double() {
      const value = this.view.getFloat64(this.ptr, true);
      this.ptr += 8;
      return value;
    }
    bytes() {
      const length2 = this.uint32();
      const from = this.ptr;
      this.ptr += length2;
      return this.buf.subarray(from, from + length2);
    }
    string() {
      return utf8$1.get().decode(this.bytes());
    }
    skip(length2) {
      if (length2 === 0)
        while (this.u8() & 128)
          ;
      else {
        if (this.index() + length2 > this.size())
          throw new Error("Error on typia.protobuf.decode(): buffer overflow.");
        this.ptr += length2;
      }
    }
    skipType(wireType) {
      switch (wireType) {
        case 0:
          this.skip(0);
          break;
        case 1:
          this.skip(8);
          break;
        case 2:
          this.skip(this.uint32());
          break;
        case 3:
          while ((wireType = this.uint32() & 7) !== 4)
            this.skipType(wireType);
          break;
        case 5:
          this.skip(4);
          break;
        default:
          throw new Error(`Invalid wire type ${wireType} at offset ${this.ptr}.`);
      }
    }
    varint32() {
      let loaded;
      let value;
      value = (loaded = this.u8()) & 127;
      if (loaded < 128)
        return value;
      value |= ((loaded = this.u8()) & 127) << 7;
      if (loaded < 128)
        return value;
      value |= ((loaded = this.u8()) & 127) << 14;
      if (loaded < 128)
        return value;
      value |= ((loaded = this.u8()) & 127) << 21;
      if (loaded < 128)
        return value;
      value |= ((loaded = this.u8()) & 15) << 28;
      if (loaded < 128)
        return value;
      if (this.u8() < 128)
        return value;
      if (this.u8() < 128)
        return value;
      if (this.u8() < 128)
        return value;
      if (this.u8() < 128)
        return value;
      if (this.u8() < 128)
        return value;
      return value;
    }
    varint64() {
      let loaded;
      let value;
      value = (loaded = this.u8n()) & BigInt(127);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(7);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(14);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(21);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(28);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(35);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(42);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(49);
      if (loaded < BigInt(128))
        return value;
      value |= ((loaded = this.u8n()) & BigInt(127)) << BigInt(56);
      if (loaded < BigInt(128))
        return value;
      value |= (this.u8n() & BigInt(1)) << BigInt(63);
      return BigInt.asIntN(64, value);
    }
    u8() {
      return this.view.getUint8(this.ptr++);
    }
    u8n() {
      return BigInt(this.u8());
    }
  };
  var utf8$1 = /* @__PURE__ */ new Singleton(() => new TextDecoder("utf-8"));
  var $strlen = (s) => {
    let b;
    let i;
    let c;
    for (b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1)
      ;
    return b;
  };
  var $ProtobufSizer = class {
    /**
     * Total length.
     */
    len;
    /**
     * Position stack.
     */
    pos;
    /**
     * Variable length list.
     */
    varlen;
    /**
     * Variable length index stack.
     */
    varlenidx;
    constructor(length2 = 0) {
      this.len = length2;
      this.pos = [];
      this.varlen = [];
      this.varlenidx = [];
    }
    bool() {
      this.len += 1;
    }
    int32(value) {
      if (value < 0) {
        this.len += 10;
      } else {
        this.varint32(value);
      }
    }
    sint32(value) {
      this.varint32(value << 1 ^ value >> 31);
    }
    uint32(value) {
      this.varint32(value);
    }
    int64(value) {
      this.varint64(typeof value === "number" ? BigInt(value) : value);
    }
    sint64(value) {
      if (typeof value === "number")
        value = BigInt(value);
      this.varint64(value << BigInt(1) ^ value >> BigInt(63));
    }
    uint64(value) {
      this.varint64(typeof value === "number" ? BigInt(value) : value);
    }
    // public fixed32(_value: number): void {
    //     this.len += 4;
    // }
    // public sfixed32(_value: number): void {
    //     this.len += 4;
    // }
    // public fixed64(_value: number | bigint): void {
    //     this.len += 8;
    // }
    // public sfixed64(_value: number | bigint): void {
    //     this.len += 8;
    // }
    float(_value) {
      this.len += 4;
    }
    double(_value) {
      this.len += 8;
    }
    bytes(value) {
      this.uint32(value.byteLength);
      this.len += value.byteLength;
    }
    string(value) {
      const len = $strlen(value);
      this.varlen.push(len);
      this.uint32(len);
      this.len += len;
    }
    fork() {
      this.pos.push(this.len);
      this.varlenidx.push(this.varlen.length);
      this.varlen.push(0);
    }
    ldelim() {
      if (!(this.pos.length && this.varlenidx.length))
        throw new Error("Error on typia.protobuf.encode(): missing fork() before ldelim() call.");
      const endPos = this.len;
      const startPos = this.pos.pop();
      const idx = this.varlenidx.pop();
      const len = endPos - startPos;
      this.varlen[idx] = len;
      this.uint32(len);
    }
    reset() {
      this.len = 0;
      this.pos.length = 0;
      this.varlen.length = 0;
      this.varlenidx.length = 0;
    }
    varint32(value) {
      this.len += value < 0 ? 10 : value < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5;
    }
    varint64(val) {
      val = BigInt.asUintN(64, val);
      while (val > BigInt(127)) {
        ++this.len;
        val = val >> BigInt(7);
      }
      ++this.len;
    }
  };
  var $ProtobufWriter = class {
    /**
     * Related sizer
     */
    sizer;
    /**
     * Current pointer.
     */
    ptr;
    /**
     * Protobuf buffer.
     */
    buf;
    /**
     * DataView for buffer.
     */
    view;
    /**
     * Index in varlen array from sizer.
     */
    varlenidx;
    constructor(sizer) {
      this.sizer = sizer;
      this.buf = new Uint8Array(sizer.len);
      this.view = new DataView(this.buf.buffer);
      this.ptr = 0;
      this.varlenidx = 0;
    }
    buffer() {
      return this.buf;
    }
    bool(value) {
      this.byte(value ? 1 : 0);
    }
    byte(value) {
      this.buf[this.ptr++] = value & 255;
    }
    int32(value) {
      if (value < 0)
        this.int64(value);
      else
        this.variant32(value >>> 0);
    }
    sint32(value) {
      this.variant32(value << 1 ^ value >> 31);
    }
    uint32(value) {
      this.variant32(value);
    }
    sint64(value) {
      value = BigInt(value);
      this.variant64(value << BigInt(1) ^ value >> BigInt(63));
    }
    int64(value) {
      this.variant64(BigInt(value));
    }
    uint64(value) {
      this.variant64(BigInt(value));
    }
    float(val) {
      this.view.setFloat32(this.ptr, val, true);
      this.ptr += 4;
    }
    double(val) {
      this.view.setFloat64(this.ptr, val, true);
      this.ptr += 8;
    }
    bytes(value) {
      this.uint32(value.byteLength);
      for (let i = 0; i < value.byteLength; i++)
        this.buf[this.ptr++] = value[i];
    }
    string(value) {
      const len = this.varlen();
      this.uint32(len);
      const binary = utf8.get().encode(value);
      for (let i = 0; i < binary.byteLength; i++)
        this.buf[this.ptr++] = binary[i];
    }
    fork() {
      this.uint32(this.varlen());
    }
    ldelim() {
    }
    finish() {
      return this.buf;
    }
    reset() {
      this.buf = new Uint8Array(this.sizer.len);
      this.view = new DataView(this.buf.buffer);
      this.ptr = 0;
      this.varlenidx = 0;
    }
    variant32(val) {
      while (val > 127) {
        this.buf[this.ptr++] = val & 127 | 128;
        val = val >>> 7;
      }
      this.buf[this.ptr++] = val;
    }
    variant64(val) {
      val = BigInt.asUintN(64, val);
      while (val > BigInt(127)) {
        this.buf[this.ptr++] = Number(val & BigInt(127) | BigInt(128));
        val = val >> BigInt(7);
      }
      this.buf[this.ptr++] = Number(val);
    }
    varlen() {
      return this.varlenidx >= this.sizer.varlen.length ? 0 : this.sizer.varlen[this.varlenidx++];
    }
  };
  var utf8 = /* @__PURE__ */ new Singleton(() => new TextEncoder());
  var decode$1 = (method) => ({
    ...is$1(),
    Reader: $ProtobufReader,
    throws: $throws(`protobuf.${method}`)
  });
  var encode$1 = (method) => ({
    ...is$1(),
    Sizer: $ProtobufSizer,
    Writer: $ProtobufWriter,
    strlen: $strlen,
    throws: $throws(method)
  });
  var LlmTypeChecker;
  (function(LlmTypeChecker2) {
    LlmTypeChecker2.visit = (schema2, callback) => {
      callback(schema2);
      if (LlmTypeChecker2.isOneOf(schema2)) schema2.oneOf.forEach((s) => LlmTypeChecker2.visit(s, callback));
      else if (LlmTypeChecker2.isObject(schema2)) {
        for (const [_, s] of Object.entries(schema2.properties ?? {})) LlmTypeChecker2.visit(s, callback);
        if (typeof schema2.additionalProperties === "object" && schema2.additionalProperties !== null) LlmTypeChecker2.visit(schema2.additionalProperties, callback);
      } else if (LlmTypeChecker2.isArray(schema2)) LlmTypeChecker2.visit(schema2.items, callback);
    };
    LlmTypeChecker2.isOneOf = (schema2) => schema2.oneOf !== void 0;
    LlmTypeChecker2.isObject = (schema2) => schema2.type === "object";
    LlmTypeChecker2.isArray = (schema2) => schema2.type === "array";
    LlmTypeChecker2.isBoolean = (schema2) => schema2.type === "boolean";
    LlmTypeChecker2.isNumber = (schema2) => schema2.type === "number";
    LlmTypeChecker2.isString = (schema2) => schema2.type === "string";
    LlmTypeChecker2.isNullOnly = (schema2) => schema2.type === "null";
    LlmTypeChecker2.isNullable = (schema2) => !LlmTypeChecker2.isUnknown(schema2) && (LlmTypeChecker2.isNullOnly(schema2) || (LlmTypeChecker2.isOneOf(schema2) ? schema2.oneOf.some(LlmTypeChecker2.isNullable) : schema2.nullable === true));
    LlmTypeChecker2.isUnknown = (schema2) => !LlmTypeChecker2.isOneOf(schema2) && schema2.type === void 0;
  })(LlmTypeChecker || (LlmTypeChecker = {}));
  var LlmSchemaSeparator;
  (function(LlmSchemaSeparator2) {
    LlmSchemaSeparator2.parameters = (props) => {
      const indexes = props.parameters.map(LlmSchemaSeparator2.schema(props.predicator));
      return {
        llm: indexes.map(([llm2], index2) => ({
          index: index2,
          schema: llm2
        })).filter(({ schema: schema2 }) => schema2 !== null),
        human: indexes.map(([, human], index2) => ({
          index: index2,
          schema: human
        })).filter(({ schema: schema2 }) => schema2 !== null)
      };
    };
    LlmSchemaSeparator2.schema = (predicator) => (input) => {
      if (predicator(input) === true) return [null, input];
      else if (LlmTypeChecker.isUnknown(input) || LlmTypeChecker.isOneOf(input)) return [input, null];
      else if (LlmTypeChecker.isObject(input)) return separateObject(predicator)(input);
      else if (LlmTypeChecker.isArray(input)) return separateArray(predicator)(input);
      return [input, null];
    };
    const separateArray = (predicator) => (input) => {
      const [x, y] = LlmSchemaSeparator2.schema(predicator)(input.items);
      return [x !== null ? {
        ...input,
        items: x
      } : null, y !== null ? {
        ...input,
        items: y
      } : null];
    };
    const separateObject = (predicator) => (input) => {
      if (!!input.additionalProperties || Object.keys(input.properties ?? {}).length === 0) return [input, null];
      const llm2 = {
        ...input,
        properties: {}
      };
      const human = {
        ...input,
        properties: {}
      };
      for (const [key, value] of Object.entries(input.properties ?? {})) {
        const [x, y] = LlmSchemaSeparator2.schema(predicator)(value);
        if (x !== null) llm2.properties[key] = x;
        if (y !== null) human.properties[key] = y;
      }
      return [Object.keys(llm2.properties).length === 0 ? null : shrinkRequired(llm2), Object.keys(human.properties).length === 0 ? null : shrinkRequired(human)];
    };
    const shrinkRequired = (input) => {
      if (input.required !== void 0) input.required = input.required.filter((key) => input.properties?.[key] !== void 0);
      return input;
    };
  })(LlmSchemaSeparator || (LlmSchemaSeparator = {}));
  var application$2 = () => ({
    finalize: (app, options) => {
      app.options = {
        separate: options?.separate ?? null
      };
      if (app.options.separate === null)
        return;
      for (const func of app.functions)
        func.separated = LlmSchemaSeparator.parameters({
          parameters: func.parameters,
          predicator: app.options.separate
        });
    }
  });
  var assert$1 = (method) => ({
    ...is$1(),
    join: $join,
    every: $every,
    guard: $guard(`typia.${method}`),
    predicate: (matched, exceptionable, closure) => {
      if (matched === false && exceptionable === true)
        throw new TypeGuardError({
          ...closure(),
          method: `typia.${method}`
        });
      return matched;
    }
  });
  var validate$1 = () => ({
    ...is$1(),
    join: $join,
    report: $report,
    predicate: (res) => (matched, exceptionable, closure) => {
      if (matched === false && exceptionable === true)
        (() => {
          res.success &&= false;
          const errorList = res.errors;
          const error = closure();
          if (errorList.length) {
            const last = errorList[errorList.length - 1].path;
            if (last.length >= error.path.length && last.substring(0, error.path.length) === error.path)
              return;
          }
          errorList.push(error);
          return;
        })();
      return matched;
    }
  });
  var random$1 = () => ({
    generator: RandomGenerator,
    pick
  });
  function assertFunction() {
    halt$8("assertFunction");
  }
  var assertFunctionPure = /* @__PURE__ */ Object.assign(
    assertFunction,
    /* @__PURE__ */ assert$1("functional.assertFunction"),
    /* @__PURE__ */ functionalAssert()
  );
  var assertParametersPure = /* @__PURE__ */ Object.assign(
    assertFunction,
    /* @__PURE__ */ assert$1("functional.assertFunction"),
    /* @__PURE__ */ functionalAssert()
  );
  function assertReturn() {
    halt$8("assertReturn");
  }
  var assertReturnPure = /* @__PURE__ */ Object.assign(
    assertReturn,
    /* @__PURE__ */ assert$1("functional.assertReturn"),
    /* @__PURE__ */ functionalAssert()
  );
  function assertEqualsFunction() {
    halt$8("assertEqualsFunction");
  }
  var assertEqualsFunctionPure = /* @__PURE__ */ Object.assign(
    assertEqualsFunction,
    /* @__PURE__ */ assert$1("functional.assertEqualsFunction"),
    /* @__PURE__ */ functionalAssert()
  );
  function assertEqualsParameters() {
    halt$8("assertEqualsParameters");
  }
  var assertEqualsParametersPure = /* @__PURE__ */ Object.assign(
    assertEqualsParameters,
    /* @__PURE__ */ assert$1("functional.assertEqualsParameters"),
    /* @__PURE__ */ functionalAssert()
  );
  function assertEqualsReturn() {
    halt$8("assertEqualsReturn");
  }
  var assertEqualsReturnPure = /* @__PURE__ */ Object.assign(
    assertEqualsReturn,
    /* @__PURE__ */ assert$1("functional.assertEqualsReturn"),
    /* @__PURE__ */ functionalAssert()
  );
  function isFunction() {
    halt$8("isFunction");
  }
  var isFunctionPure = /* @__PURE__ */ Object.assign(
    isFunction,
    /* @__PURE__ */ is$1()
  );
  function isParameters() {
    halt$8("isParameters");
  }
  var isParametersPure = /* @__PURE__ */ Object.assign(isParameters, /* @__PURE__ */ is$1());
  function isReturn() {
    halt$8("isReturn");
  }
  var isReturnPure = /* @__PURE__ */ Object.assign(
    isReturn,
    /* @__PURE__ */ is$1()
  );
  function equalsFunction() {
    halt$8("equalsFunction");
  }
  var equalsFunctionPure = /* @__PURE__ */ Object.assign(equalsFunction, /* @__PURE__ */ is$1());
  function equalsParameters() {
    halt$8("equalsParameters");
  }
  var equalsParametersPure = /* @__PURE__ */ Object.assign(equalsParameters, /* @__PURE__ */ is$1());
  function equalsReturn() {
    halt$8("equalsReturn");
  }
  var equalsReturnPure = /* @__PURE__ */ Object.assign(equalsReturn, /* @__PURE__ */ is$1());
  function validateFunction() {
    halt$8("validateFunction");
  }
  var validateFunctionPure = /* @__PURE__ */ Object.assign(validateFunction, /* @__PURE__ */ validate$1());
  function validateParameters() {
    halt$8("validateReturn");
  }
  var validateParametersPure = /* @__PURE__ */ Object.assign(validateParameters, /* @__PURE__ */ validate$1());
  function validateReturn() {
    halt$8("validateReturn");
  }
  var validateReturnPure = /* @__PURE__ */ Object.assign(validateReturn, /* @__PURE__ */ validate$1());
  function validateEqualsFunction() {
    halt$8("validateEqualsFunction");
  }
  var validateEqualsFunctionPure = /* @__PURE__ */ Object.assign(validateEqualsFunction, /* @__PURE__ */ validate$1());
  function validateEqualsParameters() {
    halt$8("validateEqualsParameters");
  }
  var validateEqualsParametersPure = /* @__PURE__ */ Object.assign(validateEqualsParameters, /* @__PURE__ */ validate$1());
  function validateEqualsReturn() {
    halt$8("validateEqualsReturn");
  }
  var validateEqualsReturnPure = /* @__PURE__ */ Object.assign(validateEqualsReturn, /* @__PURE__ */ validate$1());
  function halt$8(name2) {
    throw new Error(`Error on typia.functional.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var functional = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    assertEqualsFunction: assertEqualsFunctionPure,
    assertEqualsParameters: assertEqualsParametersPure,
    assertEqualsReturn: assertEqualsReturnPure,
    assertFunction: assertFunctionPure,
    assertParameters: assertParametersPure,
    assertReturn: assertReturnPure,
    equalsFunction: equalsFunctionPure,
    equalsParameters: equalsParametersPure,
    equalsReturn: equalsReturnPure,
    isFunction: isFunctionPure,
    isParameters: isParametersPure,
    isReturn: isReturnPure,
    validateEqualsFunction: validateEqualsFunctionPure,
    validateEqualsParameters: validateEqualsParametersPure,
    validateEqualsReturn: validateEqualsReturnPure,
    validateFunction: validateFunctionPure,
    validateParameters: validateParametersPure,
    validateReturn: validateReturnPure
  });
  function formData() {
    halt$7("formData");
  }
  var formDataPure = /* @__PURE__ */ Object.assign(
    formData,
    /* @__PURE__ */ formData$1()
  );
  function assertFormData() {
    halt$7("assertFormData");
  }
  var assertFormDataPure = /* @__PURE__ */ Object.assign(
    assertFormData,
    /* @__PURE__ */ formData$1(),
    /* @__PURE__ */ assert$1("http.assertFormData")
  );
  function isFormData() {
    halt$7("isFormData");
  }
  var isFormDataPure = /* @__PURE__ */ Object.assign(
    isFormData,
    /* @__PURE__ */ formData$1(),
    /* @__PURE__ */ is$1()
  );
  function validateFormData() {
    halt$7("validateFormData");
  }
  var validateFormDataPure = /* @__PURE__ */ Object.assign(
    validateFormData,
    /* @__PURE__ */ formData$1(),
    /* @__PURE__ */ validate$1()
  );
  function query() {
    halt$7("query");
  }
  var queryPure = /* @__PURE__ */ Object.assign(
    query,
    /* @__PURE__ */ query$1()
  );
  function assertQuery() {
    halt$7("assertQuery");
  }
  var assertQueryPure = /* @__PURE__ */ Object.assign(
    assertQuery,
    /* @__PURE__ */ query$1(),
    /* @__PURE__ */ assert$1("http.assertQuery")
  );
  function isQuery() {
    halt$7("isQuery");
  }
  var isQueryPure = /* @__PURE__ */ Object.assign(
    isQuery,
    /* @__PURE__ */ query$1(),
    /* @__PURE__ */ is$1()
  );
  function validateQuery() {
    halt$7("validateQuery");
  }
  var validateQueryPure = /* @__PURE__ */ Object.assign(
    validateQuery,
    /* @__PURE__ */ query$1(),
    /* @__PURE__ */ validate$1()
  );
  function headers() {
    halt$7("headers");
  }
  var headersPure = /* @__PURE__ */ Object.assign(
    headers,
    /* @__PURE__ */ headers$1()
  );
  function assertHeaders() {
    halt$7("assertHeaders");
  }
  var assertHeadersPure = /* @__PURE__ */ Object.assign(
    assertHeaders,
    /* @__PURE__ */ headers$1(),
    /* @__PURE__ */ assert$1("http.assertHeaders")
  );
  function isHeaders() {
    halt$7("isHeaders");
  }
  var isHeadersPure = /* @__PURE__ */ Object.assign(
    isHeaders,
    /* @__PURE__ */ headers$1(),
    /* @__PURE__ */ is$1()
  );
  function validateHeaders() {
    halt$7("validateHeaders");
  }
  var validateHeadersPure = /* @__PURE__ */ Object.assign(
    validateHeaders,
    /* @__PURE__ */ headers$1(),
    /* @__PURE__ */ validate$1()
  );
  function parameter() {
    halt$7("parameter");
  }
  var parameterPure = /* @__PURE__ */ Object.assign(
    parameter,
    /* @__PURE__ */ parameter$1(),
    /* @__PURE__ */ assert$1("http.parameter")
  );
  function createFormData() {
    halt$7("createFormData");
  }
  var createFormDataPure = /* @__PURE__ */ Object.assign(createFormData, /* @__PURE__ */ formData$1());
  function createAssertFormData() {
    halt$7("createAssertFormData");
  }
  var createAssertFormDataPure = /* @__PURE__ */ Object.assign(
    createAssertFormData,
    /* @__PURE__ */ formData$1(),
    /* @__PURE__ */ assert$1("http.createAssertFormData")
  );
  function createIsFormData() {
    halt$7("createIsFormData");
  }
  var createIsFormDataPure = /* @__PURE__ */ Object.assign(
    createIsFormData,
    /* @__PURE__ */ formData$1(),
    /* @__PURE__ */ is$1()
  );
  function createValidateFormData() {
    halt$7("createValidateFormData");
  }
  var createValidateFormDataPure = /* @__PURE__ */ Object.assign(
    createValidateFormData,
    /* @__PURE__ */ formData$1(),
    /* @__PURE__ */ validate$1()
  );
  function createQuery() {
    halt$7("createQuery");
  }
  var createQueryPure = /* @__PURE__ */ Object.assign(
    createQuery,
    /* @__PURE__ */ query$1()
  );
  function createAssertQuery() {
    halt$7("createAssertQuery");
  }
  var createAssertQueryPure = /* @__PURE__ */ Object.assign(
    createAssertQuery,
    /* @__PURE__ */ query$1(),
    /* @__PURE__ */ assert$1("http.createAssertQuery")
  );
  function createIsQuery() {
    halt$7("createIsQuery");
  }
  var createIsQueryPure = /* @__PURE__ */ Object.assign(
    createIsQuery,
    /* @__PURE__ */ query$1(),
    /* @__PURE__ */ is$1()
  );
  function createValidateQuery() {
    halt$7("createValidateQuery");
  }
  var createValidateQueryPure = /* @__PURE__ */ Object.assign(
    createValidateQuery,
    /* @__PURE__ */ query$1(),
    /* @__PURE__ */ validate$1()
  );
  function createHeaders() {
    halt$7("createHeaders");
  }
  var createHeadersPure = /* @__PURE__ */ Object.assign(createHeaders, /* @__PURE__ */ headers$1());
  function createAssertHeaders() {
    halt$7("createAssertHeaders");
  }
  var createAssertHeadersPure = /* @__PURE__ */ Object.assign(
    createAssertHeaders,
    /* @__PURE__ */ headers$1(),
    /* @__PURE__ */ assert$1("http.createAssertHeaders")
  );
  function createIsHeaders() {
    halt$7("createIsHeaders");
  }
  var createIsHeadersPure = /* @__PURE__ */ Object.assign(
    createIsHeaders,
    /* @__PURE__ */ headers$1(),
    /* @__PURE__ */ is$1()
  );
  function createValidateHeaders() {
    halt$7("createValidateHeaders");
  }
  var createValidateHeadersPure = /* @__PURE__ */ Object.assign(
    createValidateHeaders,
    /* @__PURE__ */ headers$1(),
    /* @__PURE__ */ validate$1()
  );
  function createParameter() {
    halt$7("createParameter");
  }
  var createParameterPure = /* @__PURE__ */ Object.assign(
    createParameter,
    /* @__PURE__ */ parameter$1(),
    /* @__PURE__ */ assert$1("http.createParameter")
  );
  function halt$7(name2) {
    throw new Error(`Error on typia.http.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var http = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    assertFormData: assertFormDataPure,
    assertHeaders: assertHeadersPure,
    assertQuery: assertQueryPure,
    createAssertFormData: createAssertFormDataPure,
    createAssertHeaders: createAssertHeadersPure,
    createAssertQuery: createAssertQueryPure,
    createFormData: createFormDataPure,
    createHeaders: createHeadersPure,
    createIsFormData: createIsFormDataPure,
    createIsHeaders: createIsHeadersPure,
    createIsQuery: createIsQueryPure,
    createParameter: createParameterPure,
    createQuery: createQueryPure,
    createValidateFormData: createValidateFormDataPure,
    createValidateHeaders: createValidateHeadersPure,
    createValidateQuery: createValidateQueryPure,
    formData: formDataPure,
    headers: headersPure,
    isFormData: isFormDataPure,
    isHeaders: isHeadersPure,
    isQuery: isQueryPure,
    parameter: parameterPure,
    query: queryPure,
    validateFormData: validateFormDataPure,
    validateHeaders: validateHeadersPure,
    validateQuery: validateQueryPure
  });
  function application$1() {
    halt$6("application");
  }
  var applicationPure = /* @__PURE__ */ Object.assign(
    application$1,
    /* @__PURE__ */ application$2()
  );
  function schema() {
    halt$6("schema");
  }
  function halt$6(name2) {
    throw new Error(`Error on typia.llm.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var llm = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    application: applicationPure,
    schema
  });
  function application() {
    halt$5("application");
  }
  function assertParse() {
    halt$5("assertParse");
  }
  var assertParsePure = /* @__PURE__ */ Object.assign(
    assertParse,
    /* @__PURE__ */ assert$1("json.assertParse")
  );
  function isParse() {
    halt$5("isParse");
  }
  var isParsePure = /* @__PURE__ */ Object.assign(
    isParse,
    /* @__PURE__ */ is$1()
  );
  function validateParse() {
    halt$5("validateParse");
  }
  var validateParsePure = /* @__PURE__ */ Object.assign(validateParse, /* @__PURE__ */ validate$1());
  function stringify() {
    halt$5("stringify");
  }
  var stringifyPure = /* @__PURE__ */ Object.assign(
    stringify,
    /* @__PURE__ */ stringify$1("stringify")
  );
  function assertStringify() {
    halt$5("assertStringify");
  }
  var assertStringifyPure = /* @__PURE__ */ Object.assign(
    assertStringify,
    /* @__PURE__ */ assert$1("json.assertStringify"),
    /* @__PURE__ */ stringify$1("assertStringify")
  );
  function isStringify() {
    halt$5("isStringify");
  }
  var isStringifyPure = /* @__PURE__ */ Object.assign(
    isStringify,
    /* @__PURE__ */ is$1(),
    /* @__PURE__ */ stringify$1("isStringify")
  );
  function validateStringify() {
    halt$5("validateStringify");
  }
  var validateStringifyPure = /* @__PURE__ */ Object.assign(
    validateStringify,
    /* @__PURE__ */ validate$1(),
    /* @__PURE__ */ stringify$1("validateStringify")
  );
  function createIsParse() {
    halt$5("createIsParse");
  }
  var createIsParsePure = /* @__PURE__ */ Object.assign(createIsParse, isParsePure);
  function createAssertParse() {
    halt$5("createAssertParse");
  }
  var createAssertParsePure = /* @__PURE__ */ Object.assign(createAssertParse, assertParsePure);
  function createValidateParse() {
    halt$5("createValidateParse");
  }
  var createValidateParsePure = /* @__PURE__ */ Object.assign(createValidateParse, validateParsePure);
  function createStringify() {
    halt$5("createStringify");
  }
  var createStringifyPure = /* @__PURE__ */ Object.assign(createStringify, stringifyPure);
  function createAssertStringify() {
    halt$5("createAssertStringify");
  }
  var createAssertStringifyPure = /* @__PURE__ */ Object.assign(createAssertStringify, assertStringifyPure);
  function createIsStringify() {
    halt$5("createIsStringify");
  }
  var createIsStringifyPure = /* @__PURE__ */ Object.assign(createIsStringify, isStringifyPure);
  function createValidateStringify() {
    halt$5("createValidateStringify");
  }
  var createValidateStringifyPure = /* @__PURE__ */ Object.assign(createValidateStringify, validateStringifyPure);
  function halt$5(name2) {
    throw new Error(`Error on typia.json.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var json = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    application,
    assertParse: assertParsePure,
    assertStringify: assertStringifyPure,
    createAssertParse: createAssertParsePure,
    createAssertStringify: createAssertStringifyPure,
    createIsParse: createIsParsePure,
    createIsStringify: createIsStringifyPure,
    createStringify: createStringifyPure,
    createValidateParse: createValidateParsePure,
    createValidateStringify: createValidateStringifyPure,
    isParse: isParsePure,
    isStringify: isStringifyPure,
    stringify: stringifyPure,
    validateParse: validateParsePure,
    validateStringify: validateStringifyPure
  });
  function literals() {
    halt$4("literals");
  }
  function clone() {
    halt$4("clone");
  }
  var clonePure = /* @__PURE__ */ Object.assign(
    clone,
    /* @__PURE__ */ clone$1("clone")
  );
  function assertClone() {
    halt$4("assertClone");
  }
  var assertClonePure = /* @__PURE__ */ Object.assign(
    assertClone,
    /* @__PURE__ */ assert$1("misc.assertClone"),
    /* @__PURE__ */ clone$1("assertClone")
  );
  function isClone() {
    halt$4("isClone");
  }
  var isClonePure = /* @__PURE__ */ Object.assign(
    isClone,
    /* @__PURE__ */ is$1(),
    /* @__PURE__ */ clone$1("isClone")
  );
  function validateClone() {
    halt$4("validateClone");
  }
  var validateClonePure = /* @__PURE__ */ Object.assign(
    validateClone,
    /* @__PURE__ */ validate$1(),
    /* @__PURE__ */ clone$1("validateClone")
  );
  function prune() {
    halt$4("prune");
  }
  var prunePure = /* @__PURE__ */ Object.assign(
    prune,
    /* @__PURE__ */ prune$1("prune")
  );
  function assertPrune() {
    halt$4("assertPrune");
  }
  var assertPrunePure = /* @__PURE__ */ Object.assign(
    assertPrune,
    /* @__PURE__ */ assert$1("misc.assertPrune"),
    /* @__PURE__ */ prune$1("assertPrune")
  );
  function isPrune() {
    halt$4("isPrune");
  }
  var isPrunePure = /* @__PURE__ */ Object.assign(
    isPrune,
    /* @__PURE__ */ is$1(),
    /* @__PURE__ */ prune$1("isPrune")
  );
  function validatePrune() {
    halt$4("validatePrune");
  }
  var validatePrunePure = /* @__PURE__ */ Object.assign(
    validatePrune,
    /* @__PURE__ */ prune$1("validatePrune"),
    /* @__PURE__ */ validate$1()
  );
  function createClone() {
    halt$4("createClone");
  }
  var createClonePure = /* @__PURE__ */ Object.assign(createClone, clonePure);
  function createAssertClone() {
    halt$4("createAssertClone");
  }
  var createAssertClonePure = /* @__PURE__ */ Object.assign(createAssertClone, assertClonePure);
  function createIsClone() {
    halt$4("createIsClone");
  }
  var createIsClonePure = /* @__PURE__ */ Object.assign(createIsClone, isClonePure);
  function createValidateClone() {
    halt$4("createValidateClone");
  }
  var createValidateClonePure = /* @__PURE__ */ Object.assign(createValidateClone, validateClonePure);
  function createPrune() {
    halt$4("createPrune");
  }
  var createPrunePure = /* @__PURE__ */ Object.assign(createPrune, prunePure);
  function createAssertPrune() {
    halt$4("createAssertPrune");
  }
  var createAssertPrunePure = /* @__PURE__ */ Object.assign(createAssertPrune, assertPrunePure);
  function createIsPrune() {
    halt$4("createIsPrune");
  }
  var createIsPrunePure = /* @__PURE__ */ Object.assign(createIsPrune, isPrunePure);
  function createValidatePrune() {
    halt$4("createValidatePrune");
  }
  var createValidatePrunePure = /* @__PURE__ */ Object.assign(createValidatePrune, validatePrunePure);
  function halt$4(name2) {
    throw new Error(`Error on typia.misc.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var misc = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    assertClone: assertClonePure,
    assertPrune: assertPrunePure,
    clone: clonePure,
    createAssertClone: createAssertClonePure,
    createAssertPrune: createAssertPrunePure,
    createClone: createClonePure,
    createIsClone: createIsClonePure,
    createIsPrune: createIsPrunePure,
    createPrune: createPrunePure,
    createValidateClone: createValidateClonePure,
    createValidatePrune: createValidatePrunePure,
    isClone: isClonePure,
    isPrune: isPrunePure,
    literals,
    prune: prunePure,
    validateClone: validateClonePure,
    validatePrune: validatePrunePure
  });
  function camel() {
    return halt$3("camel");
  }
  var camelPure = /* @__PURE__ */ Object.assign(
    camel,
    /* @__PURE__ */ camel$1("camel")
  );
  function assertCamel() {
    return halt$3("assertCamel");
  }
  var assertCamelPure = /* @__PURE__ */ Object.assign(
    assertCamel,
    /* @__PURE__ */ camel$1("assertCamel"),
    /* @__PURE__ */ assert$1("notations.assertCamel")
  );
  function isCamel() {
    return halt$3("isCamel");
  }
  var isCamelPure = /* @__PURE__ */ Object.assign(
    isCamel,
    /* @__PURE__ */ camel$1("isCamel"),
    /* @__PURE__ */ is$1()
  );
  function validateCamel() {
    return halt$3("validateCamel");
  }
  var validateCamelPure = /* @__PURE__ */ Object.assign(
    validateCamel,
    /* @__PURE__ */ camel$1("validateCamel"),
    /* @__PURE__ */ validate$1()
  );
  function pascal() {
    return halt$3("pascal");
  }
  var pascalPure = /* @__PURE__ */ Object.assign(
    pascal,
    /* @__PURE__ */ pascal$1("pascal")
  );
  function assertPascal() {
    return halt$3("assertPascal");
  }
  var assertPascalPure = /* @__PURE__ */ Object.assign(
    assertPascal,
    /* @__PURE__ */ pascal$1("assertPascal"),
    /* @__PURE__ */ assert$1("notations.assertPascal")
  );
  function isPascal() {
    return halt$3("isPascal");
  }
  var isPascalPure = /* @__PURE__ */ Object.assign(
    isPascal,
    /* @__PURE__ */ pascal$1("isPascal"),
    /* @__PURE__ */ is$1()
  );
  function validatePascal() {
    return halt$3("validatePascal");
  }
  var validatePascalPure = /* @__PURE__ */ Object.assign(
    validatePascal,
    /* @__PURE__ */ pascal$1("validatePascal"),
    /* @__PURE__ */ validate$1()
  );
  function snake() {
    return halt$3("snake");
  }
  var snakePure = /* @__PURE__ */ Object.assign(
    snake,
    /* @__PURE__ */ snake$1("snake")
  );
  function assertSnake() {
    return halt$3("assertSnake");
  }
  var assertSnakePure = /* @__PURE__ */ Object.assign(
    assertSnake,
    /* @__PURE__ */ snake$1("assertSnake"),
    /* @__PURE__ */ assert$1("notations.assertSnake")
  );
  function isSnake() {
    return halt$3("isSnake");
  }
  var isSnakePure = /* @__PURE__ */ Object.assign(
    isSnake,
    /* @__PURE__ */ snake$1("isSnake"),
    /* @__PURE__ */ is$1()
  );
  function validateSnake() {
    return halt$3("validateSnake");
  }
  var validateSnakePure = /* @__PURE__ */ Object.assign(
    validateSnake,
    /* @__PURE__ */ snake$1("validateSnake"),
    /* @__PURE__ */ validate$1()
  );
  function createCamel() {
    halt$3("createCamel");
  }
  var createCamelPure = /* @__PURE__ */ Object.assign(
    createCamel,
    /* @__PURE__ */ camel$1("createCamel")
  );
  function createAssertCamel() {
    halt$3("createAssertCamel");
  }
  var createAssertCamelPure = /* @__PURE__ */ Object.assign(
    createAssertCamel,
    /* @__PURE__ */ camel$1("createAssertCamel"),
    /* @__PURE__ */ assert$1("notations.createAssertCamel")
  );
  function createIsCamel() {
    halt$3("createIsCamel");
  }
  var createIsCamelPure = /* @__PURE__ */ Object.assign(
    createIsCamel,
    /* @__PURE__ */ camel$1("createIsCamel"),
    /* @__PURE__ */ is$1()
  );
  function createValidateCamel() {
    halt$3("createValidateCamel");
  }
  var createValidateCamelPure = /* @__PURE__ */ Object.assign(
    createValidateCamel,
    /* @__PURE__ */ camel$1("createValidateCamel"),
    /* @__PURE__ */ validate$1()
  );
  function createPascal() {
    halt$3("createPascal");
  }
  var createPascalPure = /* @__PURE__ */ Object.assign(createPascal, /* @__PURE__ */ pascal$1("createPascal"));
  function createAssertPascal() {
    halt$3("createAssertPascal");
  }
  var createAssertPascalPure = /* @__PURE__ */ Object.assign(
    createAssertPascal,
    /* @__PURE__ */ pascal$1("createAssertPascal"),
    /* @__PURE__ */ assert$1("notations.createAssertPascal")
  );
  function createIsPascal() {
    halt$3("createIsPascal");
  }
  var createIsPascalPure = /* @__PURE__ */ Object.assign(
    createIsPascal,
    /* @__PURE__ */ pascal$1("createIsPascal"),
    /* @__PURE__ */ is$1()
  );
  function createValidatePascal() {
    halt$3("createValidatePascal");
  }
  var createValidatePascalPure = /* @__PURE__ */ Object.assign(
    createValidatePascal,
    /* @__PURE__ */ pascal$1("createValidatePascal"),
    /* @__PURE__ */ validate$1()
  );
  function createSnake() {
    halt$3("createSnake");
  }
  var createSnakePure = /* @__PURE__ */ Object.assign(
    createSnake,
    /* @__PURE__ */ snake$1("createSnake")
  );
  function createAssertSnake() {
    halt$3("createAssertSnake");
  }
  var createAssertSnakePure = /* @__PURE__ */ Object.assign(
    createAssertSnake,
    /* @__PURE__ */ snake$1("createAssertSnake"),
    /* @__PURE__ */ assert$1("notations.createAssertSnake")
  );
  function createIsSnake() {
    halt$3("createIsSnake");
  }
  var createIsSnakePure = /* @__PURE__ */ Object.assign(
    createIsSnake,
    /* @__PURE__ */ snake$1("createIsSnake"),
    /* @__PURE__ */ is$1()
  );
  function createValidateSnake() {
    halt$3("createValidateSnake");
  }
  var createValidateSnakePure = /* @__PURE__ */ Object.assign(
    createValidateSnake,
    /* @__PURE__ */ snake$1("createValidateSnake"),
    /* @__PURE__ */ validate$1()
  );
  function halt$3(name2) {
    throw new Error(`Error on typia.notations.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var notations = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    assertCamel: assertCamelPure,
    assertPascal: assertPascalPure,
    assertSnake: assertSnakePure,
    camel: camelPure,
    createAssertCamel: createAssertCamelPure,
    createAssertPascal: createAssertPascalPure,
    createAssertSnake: createAssertSnakePure,
    createCamel: createCamelPure,
    createIsCamel: createIsCamelPure,
    createIsPascal: createIsPascalPure,
    createIsSnake: createIsSnakePure,
    createPascal: createPascalPure,
    createSnake: createSnakePure,
    createValidateCamel: createValidateCamelPure,
    createValidatePascal: createValidatePascalPure,
    createValidateSnake: createValidateSnakePure,
    isCamel: isCamelPure,
    isPascal: isPascalPure,
    isSnake: isSnakePure,
    pascal: pascalPure,
    snake: snakePure,
    validateCamel: validateCamelPure,
    validatePascal: validatePascalPure,
    validateSnake: validateSnakePure
  });
  function message() {
    halt$2("message");
  }
  function decode() {
    halt$2("decode");
  }
  var decodePure = /* @__PURE__ */ Object.assign(
    decode,
    /* @__PURE__ */ decode$1("decode")
  );
  function assertDecode() {
    halt$2("assertDecode");
  }
  var assertDecodePure = /* @__PURE__ */ Object.assign(
    assertDecode,
    /* @__PURE__ */ assert$1("protobuf.assertDecode"),
    /* @__PURE__ */ decode$1("assertDecode")
  );
  function isDecode() {
    halt$2("isDecode");
  }
  var isDecodePure = /* @__PURE__ */ Object.assign(
    isDecode,
    /* @__PURE__ */ is$1(),
    /* @__PURE__ */ decode$1("isDecode")
  );
  function validateDecode() {
    halt$2("validateDecode");
  }
  var validateDecodePure = /* @__PURE__ */ Object.assign(
    validateDecode,
    /* @__PURE__ */ validate$1(),
    /* @__PURE__ */ decode$1("validateDecode")
  );
  function encode() {
    halt$2("encode");
  }
  var encodePure = /* @__PURE__ */ Object.assign(
    encode,
    /* @__PURE__ */ encode$1("encode")
  );
  function assertEncode() {
    halt$2("assertEncode");
  }
  var assertEncodePure = /* @__PURE__ */ Object.assign(
    assertEncode,
    /* @__PURE__ */ assert$1("protobuf.assertEncode"),
    /* @__PURE__ */ encode$1("assertEncode")
  );
  function isEncode() {
    halt$2("isEncode");
  }
  var isEncodePure = /* @__PURE__ */ Object.assign(
    isEncode,
    /* @__PURE__ */ is$1(),
    /* @__PURE__ */ encode$1("isEncode")
  );
  function validateEncode() {
    halt$2("validateEncode");
  }
  var validateEncodePure = /* @__PURE__ */ Object.assign(
    validateEncode,
    /* @__PURE__ */ validate$1(),
    /* @__PURE__ */ encode$1("validateEncode")
  );
  function createDecode() {
    halt$2("createDecode");
  }
  var createDecodePure = /* @__PURE__ */ Object.assign(createDecode, /* @__PURE__ */ decode$1("createDecode"));
  function createIsDecode() {
    halt$2("createIsDecode");
  }
  var createIsDecodePure = /* @__PURE__ */ Object.assign(
    createIsDecode,
    /* @__PURE__ */ is$1(),
    /* @__PURE__ */ decode$1("createIsDecode")
  );
  function createAssertDecode() {
    halt$2("createAssertDecode");
  }
  var createAssertDecodePure = /* @__PURE__ */ Object.assign(
    createAssertDecode,
    /* @__PURE__ */ assert$1("protobuf.createAssertDecode"),
    /* @__PURE__ */ decode$1("createAssertDecode")
  );
  function createValidateDecode() {
    halt$2("createValidateDecode");
  }
  var createValidateDecodePure = /* @__PURE__ */ Object.assign(
    createValidateDecode,
    /* @__PURE__ */ validate$1(),
    /* @__PURE__ */ decode$1("createValidateDecode")
  );
  function createEncode() {
    halt$2("createEncode");
  }
  var createEncodePure = /* @__PURE__ */ Object.assign(createEncode, /* @__PURE__ */ encode$1("createEncode"));
  function createIsEncode() {
    halt$2("createIsEncode");
  }
  var createIsEncodePure = /* @__PURE__ */ Object.assign(
    createIsEncode,
    /* @__PURE__ */ is$1(),
    /* @__PURE__ */ encode$1("createIsEncode")
  );
  function createAssertEncode() {
    halt$2("createAssertEncode");
  }
  var createAssertEncodePure = /* @__PURE__ */ Object.assign(
    createAssertEncode,
    /* @__PURE__ */ assert$1("protobuf.createAssertEncode"),
    /* @__PURE__ */ encode$1("createAssertEncode")
  );
  function createValidateEncode() {
    halt$2("createValidateEncode");
  }
  var createValidateEncodePure = /* @__PURE__ */ Object.assign(
    createValidateEncode,
    /* @__PURE__ */ validate$1(),
    /* @__PURE__ */ encode$1("createValidateEncode")
  );
  function halt$2(name2) {
    throw new Error(`Error on typia.protobuf.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var protobuf = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    assertDecode: assertDecodePure,
    assertEncode: assertEncodePure,
    createAssertDecode: createAssertDecodePure,
    createAssertEncode: createAssertEncodePure,
    createDecode: createDecodePure,
    createEncode: createEncodePure,
    createIsDecode: createIsDecodePure,
    createIsEncode: createIsEncodePure,
    createValidateDecode: createValidateDecodePure,
    createValidateEncode: createValidateEncodePure,
    decode: decodePure,
    encode: encodePure,
    isDecode: isDecodePure,
    isEncode: isEncodePure,
    message,
    validateDecode: validateDecodePure,
    validateEncode: validateEncodePure
  });
  function metadata() {
    halt$1("metadata");
  }
  var metadataPure = /* @__PURE__ */ Object.assign(metadata, { from: (input) => input });
  function name() {
    halt$1("name");
  }
  function halt$1(name2) {
    throw new Error(`Error on typia.reflect.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var reflect = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    metadata: metadataPure,
    name
  });
  var index = /* @__PURE__ */ Object.freeze({
    __proto__: null
  });
  function assert() {
    halt("assert");
  }
  var assertPure = /* @__PURE__ */ Object.assign(
    assert,
    /* @__PURE__ */ assert$1("assert")
  );
  function assertGuard() {
    halt("assertGuard");
  }
  var assertGuardPure = /* @__PURE__ */ Object.assign(
    assertGuard,
    /* @__PURE__ */ assert$1("assertGuard")
  );
  function is() {
    halt("is");
  }
  var isPure = /* @__PURE__ */ Object.assign(
    is,
    /* @__PURE__ */ assert$1("is")
  );
  function validate() {
    halt("validate");
  }
  var validatePure = /* @__PURE__ */ Object.assign(
    validate,
    /* @__PURE__ */ validate$1()
  );
  function assertEquals() {
    halt("assertEquals");
  }
  var assertEqualsPure = /* @__PURE__ */ Object.assign(assertEquals, /* @__PURE__ */ assert$1("assertEquals"));
  function assertGuardEquals() {
    halt("assertGuardEquals");
  }
  var assertGuardEqualsPure = /* @__PURE__ */ Object.assign(assertGuardEquals, /* @__PURE__ */ assert$1("assertGuardEquals"));
  function equals() {
    halt("equals");
  }
  var equalsPure = /* @__PURE__ */ Object.assign(
    equals,
    /* @__PURE__ */ is$1()
  );
  function validateEquals() {
    halt("validateEquals");
  }
  var validateEqualsPure = /* @__PURE__ */ Object.assign(validateEquals, /* @__PURE__ */ validate$1());
  function random() {
    halt("random");
  }
  var randomPure = /* @__PURE__ */ Object.assign(
    random,
    /* @__PURE__ */ random$1()
  );
  function createAssert() {
    halt("createAssert");
  }
  var createAssertPure = /* @__PURE__ */ Object.assign(createAssert, assertPure);
  function createAssertGuard() {
    halt("createAssertGuard");
  }
  var createAssertGuardPure = /* @__PURE__ */ Object.assign(createAssertGuard, assertGuardPure);
  function createIs() {
    halt("createIs");
  }
  var createIsPure = /* @__PURE__ */ Object.assign(createIs, isPure);
  function createValidate() {
    halt("createValidate");
  }
  var createValidatePure = /* @__PURE__ */ Object.assign(createValidate, validatePure);
  function createAssertEquals() {
    halt("createAssertEquals");
  }
  var createAssertEqualsPure = /* @__PURE__ */ Object.assign(createAssertEquals, assertEqualsPure);
  function createAssertGuardEquals() {
    halt("createAssertGuardEquals");
  }
  var createAssertGuardEqualsPure = /* @__PURE__ */ Object.assign(createAssertGuardEquals, assertGuardEqualsPure);
  function createEquals() {
    halt("createEquals");
  }
  var createEqualsPure = /* @__PURE__ */ Object.assign(createEquals, equalsPure);
  function createValidateEquals() {
    halt("createValidateEquals");
  }
  var createValidateEqualsPure = /* @__PURE__ */ Object.assign(createValidateEquals, validateEqualsPure);
  function createRandom() {
    halt("createRandom");
  }
  var createRandomPure = /* @__PURE__ */ Object.assign(createRandom, randomPure);
  function halt(name2) {
    throw new Error(`Error on typia.${name2}(): no transform has been configured. Read and follow https://typia.io/docs/setup please.`);
  }
  var typia = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    TypeGuardError,
    assert: assertPure,
    assertEquals: assertEqualsPure,
    assertGuard: assertGuardPure,
    assertGuardEquals: assertGuardEqualsPure,
    createAssert: createAssertPure,
    createAssertEquals: createAssertEqualsPure,
    createAssertGuard: createAssertGuardPure,
    createAssertGuardEquals: createAssertGuardEqualsPure,
    createEquals: createEqualsPure,
    createIs: createIsPure,
    createRandom: createRandomPure,
    createValidate: createValidatePure,
    createValidateEquals: createValidateEqualsPure,
    equals: equalsPure,
    functional,
    http,
    is: isPure,
    json,
    llm,
    misc,
    notations,
    protobuf,
    random: randomPure,
    reflect,
    tags: index,
    validate: validatePure,
    validateEquals: validateEqualsPure
  });

  // output/something/check.ts
  var check = (() => {
    const $guard2 = typia.createAssert.guard;
    const $io0 = (input) => "string" === typeof input.id && /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.id) && ("string" === typeof input.email && /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(input.email)) && ("number" === typeof input.age && (19 < input.age && input.age <= 100));
    const $ao0 = (input, _path, _exceptionable = true) => ("string" === typeof input.id && (/^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.id) || $guard2(_exceptionable, {
      path: _path + ".id",
      expected: 'string & Format<"uuid">',
      value: input.id
    }, _errorFactory)) || $guard2(_exceptionable, {
      path: _path + ".id",
      expected: '(string & Format<"uuid">)',
      value: input.id
    }, _errorFactory)) && ("string" === typeof input.email && (/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(input.email) || $guard2(_exceptionable, {
      path: _path + ".email",
      expected: 'string & Format<"email">',
      value: input.email
    }, _errorFactory)) || $guard2(_exceptionable, {
      path: _path + ".email",
      expected: '(string & Format<"email">)',
      value: input.email
    }, _errorFactory)) && ("number" === typeof input.age && (19 < input.age || $guard2(_exceptionable, {
      path: _path + ".age",
      expected: "number & ExclusiveMinimum<19>",
      value: input.age
    }, _errorFactory)) && (input.age <= 100 || $guard2(_exceptionable, {
      path: _path + ".age",
      expected: "number & Maximum<100>",
      value: input.age
    }, _errorFactory)) || $guard2(_exceptionable, {
      path: _path + ".age",
      expected: "(number & ExclusiveMinimum<19> & Maximum<100>)",
      value: input.age
    }, _errorFactory));
    const __is = (input) => "object" === typeof input && null !== input && $io0(input);
    let _errorFactory;
    return (input, errorFactory) => {
      if (false === __is(input)) {
        _errorFactory = errorFactory;
        ((input2, _path, _exceptionable = true) => ("object" === typeof input2 && null !== input2 || $guard2(true, {
          path: _path + "",
          expected: "IMember",
          value: input2
        }, _errorFactory)) && $ao0(input2, _path + "", true) || $guard2(true, {
          path: _path + "",
          expected: "IMember",
          value: input2
        }, _errorFactory))(input, "$input", true);
      }
      return input;
    };
  })();
  var member = {
    id: "eef46580-5ea1-4ab3-a9be-329f6a793deb",
    email: "test@tset.com",
    age: 20
  };
  var things = (() => {
    const $guard2 = typia.assertGuard.guard;
    const $io0 = (input) => "string" === typeof input.id && /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.id) && ("string" === typeof input.email && /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(input.email)) && ("number" === typeof input.age && (19 < input.age && input.age <= 100));
    const $ao0 = (input, _path, _exceptionable = true) => ("string" === typeof input.id && (/^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.id) || $guard2(_exceptionable, {
      path: _path + ".id",
      expected: 'string & Format<"uuid">',
      value: input.id
    }, _errorFactory)) || $guard2(_exceptionable, {
      path: _path + ".id",
      expected: '(string & Format<"uuid">)',
      value: input.id
    }, _errorFactory)) && ("string" === typeof input.email && (/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(input.email) || $guard2(_exceptionable, {
      path: _path + ".email",
      expected: 'string & Format<"email">',
      value: input.email
    }, _errorFactory)) || $guard2(_exceptionable, {
      path: _path + ".email",
      expected: '(string & Format<"email">)',
      value: input.email
    }, _errorFactory)) && ("number" === typeof input.age && (19 < input.age || $guard2(_exceptionable, {
      path: _path + ".age",
      expected: "number & ExclusiveMinimum<19>",
      value: input.age
    }, _errorFactory)) && (input.age <= 100 || $guard2(_exceptionable, {
      path: _path + ".age",
      expected: "number & Maximum<100>",
      value: input.age
    }, _errorFactory)) || $guard2(_exceptionable, {
      path: _path + ".age",
      expected: "(number & ExclusiveMinimum<19> & Maximum<100>)",
      value: input.age
    }, _errorFactory));
    const __is = (input) => "object" === typeof input && null !== input && $io0(input);
    let _errorFactory;
    return (input, errorFactory) => {
      if (false === __is(input)) {
        _errorFactory = errorFactory;
        ((input2, _path, _exceptionable = true) => ("object" === typeof input2 && null !== input2 || $guard2(true, {
          path: _path + "",
          expected: "IMember",
          value: input2
        }, _errorFactory)) && $ao0(input2, _path + "", true) || $guard2(true, {
          path: _path + "",
          expected: "IMember",
          value: input2
        }, _errorFactory))(input, "$input", true);
      }
    };
  })()(member);
  console.log(things.id, things.email, things.age);
})();
