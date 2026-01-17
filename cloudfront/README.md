# CloudFront Configuration for Next.js RSC Caching

AWS CloudFront를 사용하여 Next.js RSC 페이로드를 효과적으로 캐싱하는 방법입니다.

## 문제점

Next.js의 클라이언트 사이드 네비게이션은 `_rsc` 쿼리 파라미터를 사용합니다.
이 파라미터는 사용자의 출발 페이지에 따라 다른 해시값을 가지므로,
동일한 데이터에 대해 CDN 캐시 미스가 발생합니다.

## 해결책

### Option 1: CloudFront Function으로 `_rsc` 정규화

`_rsc` 파라미터를 고정값으로 변경하여 캐시 키를 통일합니다.

#### 설정 단계

1. **CloudFront Functions 생성**

   - AWS Console > CloudFront > Functions 이동
   - "Create function" 클릭
   - `normalize-rsc.js` 내용 붙여넣기
   - Publish

2. **Distribution에 연결**
   - CloudFront Distribution 선택
   - Behaviors 탭 > Edit
   - Function associations > Viewer request에 함수 선택
   - Save changes

### Option 2: Cache Policy로 `_rsc` 파라미터 제외

캐시 키 계산 시 `_rsc` 파라미터를 제외합니다.

#### 설정 단계

1. **Custom Cache Policy 생성**
   - AWS Console > CloudFront > Policies > Cache 탭
   - "Create cache policy" 클릭
   - Query strings: "All except" 선택
   - `_rsc` 추가
   - 또는 `cache-policy.json`을 AWS CLI로 생성:

```bash
aws cloudfront create-cache-policy \
  --cache-policy-config file://cache-policy.json
```

2. **Distribution에 적용**
   - CloudFront Distribution 선택
   - Behaviors 탭 > Edit
   - Cache policy에서 생성한 정책 선택

## 주의사항

> ⚠️ **Partial Rendering 영향**
>
> 이 설정은 Next.js의 Partial Rendering 최적화를 비활성화합니다.
> 서버는 항상 전체 페이지 데이터를 반환하게 됩니다.
>
> 대부분의 경우 CDN 캐싱의 이점이 Partial Rendering 손실보다 큽니다.

## 테스트

1. CloudFront 설정 적용 후
2. 다른 페이지에서 동일한 제품 페이지로 이동
3. CloudFront 액세스 로그 또는 `x-cache` 헤더 확인
4. "Hit from cloudfront" 확인

## Terraform 예시

```hcl
resource "aws_cloudfront_function" "normalize_rsc" {
  name    = "normalize-rsc"
  runtime = "cloudfront-js-1.0"
  code    = file("${path.module}/normalize-rsc.js")
}

resource "aws_cloudfront_distribution" "main" {
  # ... 기타 설정 ...

  default_cache_behavior {
    # ... 기타 설정 ...

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.normalize_rsc.arn
    }
  }
}
```

## 관련 파일

- `normalize-rsc.js` - CloudFront Function 코드
- `cache-policy.json` - AWS CLI용 Cache Policy 정의
