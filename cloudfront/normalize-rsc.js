// CloudFront Function: Normalize _rsc Query Parameter
//
// 이 함수는 RSC 요청의 _rsc 쿼리 파라미터를 고정값으로 정규화합니다.
// 이를 통해 동일한 페이지에 대한 요청이 CDN에서 캐시 히트될 수 있습니다.
//
// 설정 방법:
// 1. AWS Console > CloudFront > Functions 에서 새 함수 생성
// 2. 아래 코드 붙여넣기
// 3. Viewer Request 이벤트에 연결

function handler(event) {
  var request = event.request;
  var querystring = request.querystring;

  // _rsc 파라미터가 있는지 확인
  if (querystring._rsc) {
    // _rsc 파라미터를 고정값 '1'로 설정
    // 이렇게 하면 모든 RSC 요청이 동일한 캐시 키를 사용
    querystring._rsc = { value: '1' };
  }

  return request;
}
