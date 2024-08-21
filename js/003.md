자바스크립트 이벤트 루프

자바스크립트는 싱글스레드 기반의 엔진으로써 콜스택 내부의 컨텍스트를 한 번에 하나씩 처리할 수 있다.
만약 자바스크립트가 처리하는데 30초가 걸리는 테스크가 있다고 보자. 그렇다면 꼼짝없이 30초 기다려야하는데
누가 자바스크립트로 서비스를 구현할까?

다행히도 자바스크립트는 시간이 오래걸리는 작업들에 대해서 처리를 도와줄 수 있는 WebAPI들이 있다.
WebAPIs는 비동기적으로 실행하는 작업들을 전담해서 처리하는데, 이를 이용하면 시간이 오래 걸리는 작업들이 있더라도
우리는 브라우저를 자유롭게 사용할 수 있는 것이다.

![eventloop](https://kimkoungho.github.io/assets/images/posts/20181223/javascript_runtime_enviornment.jpeg)

WebAPIs에는 DOM, AJAX (XMLHttpRequest), setTimeout등의 API들이 있는데 이 API를 실행하는 작업들은
각 작업이 처리되면 그림과 같이 Callback Queue에 들어가서 Call Stack이 비워지기를 기다린다.

Callback Queue에는 세 가지로 분류가 되는데 다음과 같다.

1. Microtask Queue (Promise.then ...)
2. Task Queue (setTimeout ...)
3. Animation Frames

우선순위는 숫자에 적힌 순서대로 높다. 만약 Task Queue와 Microtask Queue에 각각 Web APIs에서 처리된 함수들이 있다면
우선순위가 높은 Microtask Queue가 먼저 처리되게 된다.

```js
console.log("시작");

setTimeout(() => {
  console.log("타이머 완료");
}, 0);

Promise.resolve().then(() => {
  console.log("프로미스 완료");
});

console.log("끝");
```

위의 예시는 우선순위에 따라 처리되는 결과를 알아보기 위해 작성됐다.
코드를 실행해보면

시작
끝
프로미스 완료
타이머 완료

위의 순서대로 실행이 되는데 setTimeout은 먼저 실행됐음에도 Promise보다 늦게 실행된 것을 볼 수 있다.
그럼 다음의 코드는 어떻게 실행이 될까?

```js
console.log("시작");

setTimeout(() => {
  console.log("타이머 완료");
});

Promise.resolve().then(() => {
  console.log("프로미스 완료");

  Promise.resolve().then(() => {
    console.log("프로미스2 완료");

    Promise.resolve().then(() => {
      console.log("프로미스3 완료");
    });
  });
});

console.log("끝");
```

시작
끝
프로미스 완료
프로미스2 완료
프로미스3 완료
타이머 완료

위와 같이 실행이 된다. 이번에도 setTimeout은 가장 마지막에 실행이 된 모습이다.
이번에는 Promise안에 Promise안에 Promise가 있는 형태인데, 그렇다면 Microtask Queue에는 Promise가 3개가 쌓여있을까?

그렇지 않다. 처음 Promise가 실행되고 남은 결과는

```js
() => {
  console.log("프로미스 완료");

  Promise.resolve().then(() => {
    console.log("프로미스2 완료");

    Promise.resolve().then(() => {
      console.log("프로미스3 완료");
    });
  });
};
```

이렇게 나올 것이고 이 값은 콜스택에 다시 들어가게 될 것이다. 이 후에 console.log("프로미스 완료") 를 실행시키고
Web API를 통해서 Microtask Queue에 새로운 Promise를 넣어줄 것이다. 새로운 Queue에 Promise를 넣는 작업이 완료되면 콜스택에서 제거한다.
그럼 현재 TaskQueue에는 setTimeout을 통해 나온 작업이 있을 것이고, Microtask Queue에는 새로운 작업이 있을 것이다.

위와 같은 동작을 하게끔 하는 것이 이벤트 루프다. 따라서 "이벤트 루프는 브라우저 동작을 제어하는 관리자" 라고 불리기도 한다.
