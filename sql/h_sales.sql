DECLARE @기간 INT = 3; -- 조회할 직전 기간 (예: 3개월, 6개월 등)
DECLARE @기준인덱스 INT;
DECLARE @CSO코드 NVARCHAR(28);

-- 특정 이메일 목록
DECLARE @특정이메일 TABLE (email NVARCHAR(100));
INSERT INTO @특정이메일 VALUES ('jeongjae.lee@ajubio.com'), ('inmo.yang@ajubio.com'), ('junho.kim@ajubio.com');

-- 기준 인덱스를 SALES_TB 테이블의 sales_index 최대값으로 설정
SET @기준인덱스 = (SELECT MAX([sales_index]) FROM [dbo].[SALES_TB]);

-- 이메일에 해당하는 CSO 코드 가져오기
SET @CSO코드 = (SELECT [cso_cd] 
                FROM [dbo].[CSO_TB] 
                WHERE [cso_abmail] = @CSO_AB메일);

-- 병원별 품목군별 CSO별 실적 조회
SELECT 
    [dbo].[HOSPITAL_TB].[hos_abbr] AS [병원명],
    [dbo].[HOSPITAL_TB].[hos_type] AS [병원종별],
    [dbo].[BLOCK_TB].[cso_cd] AS [CSO코드],
    [dbo].[CSO_TB].[cso_dealer_nm] AS [CSO딜러명],
    [dbo].[PRODUCT_TB].[drug_class] AS [품목군],
    [dbo].[SALES_TB].[sales_year] AS [년],
    [dbo].[SALES_TB].[sales_month] AS [월],
    SUM([dbo].[SALES_TB].[drug_cnt]) AS [월별총처방수량],
    SUM([dbo].[SALES_TB].[drug_cnt] * [dbo].[PRODUCT_TB].[drug_price]) AS [월별총매출금액]
FROM 
    [dbo].[SALES_TB]
JOIN 
    [dbo].[HOSPITAL_TB]
ON 
    [dbo].[SALES_TB].[sfa_cd] = [dbo].[HOSPITAL_TB].[sfa_cd]
JOIN 
    [dbo].[PRODUCT_TB]
ON 
    [dbo].[SALES_TB].[drug_cd] = [dbo].[PRODUCT_TB].[drug_cd]
    AND [dbo].[SALES_TB].[sales_index] >= [dbo].[PRODUCT_TB].[start_index]
    AND [dbo].[SALES_TB].[sales_index] <= [dbo].[PRODUCT_TB].[end_index]
JOIN 
    [dbo].[BLOCK_TB]
ON 
    [dbo].[SALES_TB].[sfa_cd] = [dbo].[BLOCK_TB].[sfa_cd]
    AND [dbo].[SALES_TB].[drug_cd] = [dbo].[BLOCK_TB].[drug_cd] -- 품목별 연결
JOIN 
    [dbo].[CSO_TB]
ON 
    [dbo].[BLOCK_TB].[cso_cd] = [dbo].[CSO_TB].[cso_cd]
WHERE 
    [dbo].[HOSPITAL_TB].[hos_name] LIKE '%' + @병원명 + '%'
    AND [dbo].[SALES_TB].[sales_index] BETWEEN (@기준인덱스 - @기간+1) AND @기준인덱스
    AND (
        @CSO코드 = [dbo].[BLOCK_TB].[cso_cd] -- 일반 이메일 조건
        OR EXISTS (SELECT 1 FROM @특정이메일 WHERE email = @CSO_AB메일) -- 특정 이메일
    )
GROUP BY 
    [dbo].[HOSPITAL_TB].[hos_abbr],
    [dbo].[HOSPITAL_TB].[hos_type],
    [dbo].[BLOCK_TB].[cso_cd],
    [dbo].[CSO_TB].[cso_dealer_nm],
    [dbo].[PRODUCT_TB].[drug_class],
    [dbo].[SALES_TB].[sales_year],
    [dbo].[SALES_TB].[sales_month]
ORDER BY 
    [병원명], [CSO코드], [품목군], [년], [월];

-- 특정 이메일 권한 여부 메시지 출력
IF EXISTS (SELECT 1 FROM @특정이메일 WHERE email = @CSO_AB메일)
BEGIN
    PRINT '특정 이메일로 조회 중: 모든 데이터 접근 가능합니다.';
END
ELSE IF @CSO코드 IS NOT NULL
BEGIN
    PRINT '입력한 이메일에 해당하는 CSO 데이터 조회 중.';
END
ELSE
BEGIN
    PRINT '입력한 이메일에 해당하는 CSO 데이터가 없습니다.';
END;