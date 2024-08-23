클로저는 왜 중요한 개념일까?

클로저란 함수와 그 함수가 선언된 렉시컬 환경의 조합이라고 한다.
환경이란 말은 직관적이지 않으니 스코프라고 다시 생각해보자.
함수와 그 함수가 선언된 렉시컬 스코프(어휘적 범위)의 조합이라고 정의한 다음 코드로 확인해보자.

```js
function foo() {
  var item = "item";
}
```

여기서 item을 log로 확인하려면 console.log()의 위치는 어디에 있어야 할까?

```js
function foo() {
  var item = "item";
}
console.log(item); // ❌
```

```js
function foo() {
  var item = "item";
  console.log(item); // ✅
}
```

foo 함수의 어휘적 범위 (lexical scope) 안에서 console.log를 사용해야 할 것이다.
전역 범위에서 console.log(item)을 한다면 item에 대해서 찾을 수 없다.
이처럼 특정 변수나 객체를 조회하는 행위는 그 객체를 조회할 수 있는 범위내에서 할 수 있다.

얼핏보면 당연한 이야기인 클로저가 왜 중요하게 여겨지는 것일까?

가장 중요하게 여기는 이유중 하나는 아무래도 캡슐화와 데이터 은닉이 가능하다는 점일 것이다.
캡슐화와 데이터 은닉은 객체 지향 프로그래밍에서 아주 중요하게 다뤄지는 개념이다.

객체 지향에서 가장 중요한 것은 각 객체가 가지고 있는 데이터는 외부에서 직접 수정 및 조회를 할 수 없다.
그 데이터를 가지고 있는 객체의 메소드를 통해서 소통하는 것 만이 유일한 방법이다. 이를 클로저를 이용해서 보자.

```js
function foo() {
  var data = 10;

  function set(value) {
    data = value;
  }

  return {
    get: function () {
      console.log(data);
      return data;
    },

    plus: function () {
      set(data + 1);
    },

    minus: function () {
      set(data - 1);
    },
  };
}

const obj = foo();
obj.get(); // 10
obj.plus();
obj.get(); // 11
obj.minus();
obj.minus();
obj.get(); // 9
```

foo라는 함수의 내부 데이터에 접근하기 위해서는 foo 함수로 부터 나온 get()을 사용해야 얻을 수 있다.

그런데 이 방식은 클로저를 이용한 내부 데이터의 은닉과 캡슐화 정도로만 사용이 가능한 방법이다.
그렇다면 좀 더 객체 지향 프로그래밍을 하듯이 하려면 어떻게 해야할까?

```js
function Foo() {
  var data = 10;

  this.get = function () {
    console.log(data);
    return data;
  };

  this.set = function (value) {
    data = value;
  };

  this.plus = function () {
    this.set(data + 1);
  };

  this.minus = function () {
    this.set(data - 1);
  };
}

const obj = new Foo();
obj.get();
obj.plus();
obj.get();
obj.minus();
obj.minus();
obj.get();
```

답은 생성자 함수를 사용하는 것이다. 위의 두 함수의 공통점을 먼저 찾아보자.
우선 둘 다 데이터를 은닉했고, 데이터에 접근하는 방법을 만들어서 제공했다.
사용자는 오직 객체가 제시한 메소드를 이용해서 데이터에 접근 및 수정이 가능하다.

그렇다면 뭐가 다른걸까?

첫 번째로 생성자 함수로 만들어진 객체는 prototype의 constructor가 Foo 함수로 지정된다.
관계되어 있는 코드가 무엇인지 확실하게 알 수가 있다.
그에 반해서 일반 함수로 만들어진 객체는 prototype의 constructor가 Object 객체다.
이 객체는 클로저를 가지고 있는 일반적인 객체로써 존재하게 된다.

두 번째로 생성자 함수는 메서드의 추가 및 수정이 가능하다.

```js
Foo.prototype.double = function () {
  this.set(this.get() * 2);
};
```

이런식으로 Foo 생성자 함수에 메소드를 추가할 수 있다.
하지만 이 방식은 원래 있던 생성자 함수 Foo를 수정하는 방식이다.
원래 있던 함수는 수정하지 않으면서 새로운 메소드를 추가하는 것이 무엇인가?

그렇다 상속이다. 생성자 함수를 이용하면 상속도 가능하다.

```js
function FooVersion2() {
  Foo.call(this);
}

FooVersion2.prototype = Object.create(Foo.prototype);
FooVersion2.prototype.constructor = FooVersion2;

FooVersion2.prototype.double = function () {
  var data = this.get();
  this.set(data * 2);
};

const newversion = new FooVersion2();
newversion.double();
newversion.get();
```

어쩌다보니 상속까지 내용이 추가되었다. 이는 의도한 결과가 아니므로 다시 클로저로 돌아가겠다.

```js
function Foo() {
  var data = 10;

  this.get = function () {
    console.log(data);
    return data;
  };

  this.set = function (value) {
    data = value;
  };

  this.plus = function () {
    this.set(data + 1);
  };

  this.minus = function () {
    this.set(data - 1);
  };
}

const obj = new Foo();
obj.plus();
obj.get(); // 11
const obj2 = new Foo();
obj2.get(); // 10
```

위의 코드를 보면 obj는 값이 1이 추가되었어도 obj2는 내부 데이터의 값이 변하지 않는다.
이를 자신만의 private한 상태를 가지게 되었다고 말하는데 결국 클로저를 이용한 캡슐화를 설명하기 위함이었다.
이 방식을 이용하면 private한 데이터와 메소드를 가질 수 있다. 이 말은 다시 생각해보면 인스턴스를 생성할 때마다
메소드가 복사가 된다고 볼 수 있다. 그래서 메모리의 사용량이 늘어나기 때문에
보통은 프로토타입으로 메소드를 공유하는 방식을 이용한다.

Example

```js
function MyObject(name, message) {
  this.name = name.toString();
  this.message = message.toString();
}
MyObject.prototype = {
  getName: function () {
    return this.name;
  },
  getMessage: function () {
    return this.message;
  },
};
```
