자바스크립트 비동기

비동기가 무엇인 지 알기 위해서는 동기적임은 무엇인가를 알아야 한다.

1. 동기 (Synchronous)

- 작업이 순차적으로 이루어 진다. 하나의 작업이 끝날 때까지 다음 작업으로 넘어가지 않는다.
- 더 딥하게 보면 작업이 끝날 때까지 제어권을 반환하지 않는다.
- 위를 블로킹이라고 한다.

2. 비동기 (Asynchronous)

- 작업이 순차적으로 이루어지지 않는다. 작업이 끝나지 않더라도 다음 작업을 이어나간다.
- 작업이 끝나지 않더라도 제어권을 반환한다.
- 위를 논 블로킹이라고 한다.

비동기 프로그래밍을 언급하면 늘 나오는 단어가 있다. 바로 "콜백 함수"다.
콜백 함수는 어떤 함수의 인자로 전달되어 나중에 호출이 되는 함수다.
콜백 함수와 비동기 작업에 대한 연관성을 찾으면 콜백 지옥이라는 단어도 따라오는데,
이는 예시를 보며 확인하는 것이 편하다.

```js
getImage(filePath, (image, err) => {
  if (err) throw new Error(err);
  resizeImage(image, (resizedImage, err) => {
    if (err) throw new Error(err);
    optimizeImage(resizedImage, (optimizedImage, err) => {
      if (err) throw new Error(err);
      ...
    });
  });
});
```

위의 예시는 콜백 지옥에 대한 예시다. 이미지를 받고, 사이즈를 조절하고, 최적화 하며 이런저런 작업이 추가된다면
코드는 계단처럼 길어지게 된다. 이는 가독성, 유지보수성이 떨어지는 효과가 있다.

이러한 콜백 지옥을 해결하려면 어떻게 해야할까? 바로 코드로 보자.

```js
function getImage(filePath) {
  return new Promise((resolve, reject) => {
    // 원래의 getImage 로직
  });
}

function resizeImage(image) {
  return new Promise((resolve, reject) => {
    // 원래의 resizeImage 로직
  });
}

function optimizeImage(image) {
  return new Promise((resolve, reject) => {
    // 원래의 optimizeImage 로직
  });
}

getImage(filePath)
  .then((image) => resizeImage(image))
  .then((resizedImage) => optimizeImage(resizedImage))
  .then((optimizedImage) => ...)
  .catch((error) => {
    console.error("이미지 처리 중 오류 발생:", error);
    throw error;
  });
```

이는 ES6에 도입된 Promise 객체다. then 체인을 이어간다면 콜백 지옥에서 쉽게 벗어날 수 있다.

Promise 객체의 다양한 메서드

1. then: 성공적으로 이행된 결과 처리.
2. catch: Promise가 거부됐을 때 에러 처리.
3. finally: 성공 여부에 상관없이 항상 실행되는 코드 정의.
4. all: 모든 Promise가 성공적으로 이행되었을 때 결과를 배열로 반환.
5. race: 모든 Promise 중에 가장 먼저 이행되거나 거부된 Promise의 결과를 반환.
6. allSettled: 모든 Promise의 이행 여부에 관계없이 모든 Promise의 결과를 배열로 반환.

그렇지만 위에 코드도 한없이 길어진다고 생각하면 코드의 가독성이 줄어들긴 마찬가지이다.
또한 비동기 함수와 동기 함수의 차이점을 알기도 힘들다.
가독성도 좋게 만들고 동기와 비동기의 구분도 지을 수 있는 방법은 async / await이다.

```js
async function processImage(filePath) {
  try {
    const image = await getImage(filePath);
    const resizedImage = await resizeImage(image);
    const optimizedImage = await optimizeImage(resizedImage);

    // 추가 처리...
    return optimizedImage;
  } catch (error) {
    console.error("이미지 처리 중 오류 발생:", error);
    throw error;
  }
}
```

위의 코드는 async / await을 사용한 예시이다. 모든 비동기 함수는 동기적으로 사용할 수 있게 된다.
getImage가 끝날때 까지 대기 후 resizeImage를 실행한다. 과정에서 error가 발생한다면 catch에서 잡을 수 있다.
이 방식의 장점은 직관적이어서 가독성이 높고 중간에 동기적 코드를 추가한다고 해도 헷갈리지 않는다.
