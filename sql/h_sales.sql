-- DECLARE @abmail NVARCHAR(44) = 'jhbio@ajubio.com'; -- 입력된 회사 이메일
-- DECLARE @hospitalName NVARCHAR(78) = '강남세브'; -- 병원명
-- DECLARE @monthCount INT = 6; -- 조회 기간(월수)

-- 관리자의 이메일 리스트
DECLARE @adminEmails TABLE ([email] NVARCHAR(44));
INSERT INTO @adminEmails ([email])
VALUES ('jeongjae.lee@ajubio.com'), ('inmo.yang@ajubio.com'), ('junho.kim@ajubio.com'); -- 관리자 이메일 추가

-- 가장 최근의 salesIndex를 계산
DECLARE @maxSalesIndex INT;
SELECT @maxSalesIndex = MAX([sales_index])
FROM [dbo].[SALES_TB];

-- 조회 시작 인덱스 계산
DECLARE @startSalesIndex INT = @maxSalesIndex - @monthCount + 1;

-- 이메일 기반 분기 처리
IF @abmail IN (SELECT [email] FROM @adminEmails)
BEGIN
    -- 관리자 이메일: 모든 병원 조회 가능
    WITH authenticatedHospitals AS (
        SELECT DISTINCT 
            [h].[sfa_cd] AS [sfaCode], 
            [h].[hos_abbr] AS [hospitalAbbreviation], 
            [h].[hos_name] AS [hospitalName]
        FROM [dbo].[HOSPITAL_TB] [h]
    ),
    filteredSales AS (
        SELECT 
            [s].[sfa_cd] AS [sfaCode],
            [p].[drug_class] AS [productGroup], -- 품목군
            [s].[sales_year] AS [salesYear],
            [s].[sales_month] AS [salesMonth],
            [s].[sales_index] AS [salesIndex],
            [s].[drug_cnt] AS [drugCount],
            [p].[drug_price] AS [drugPrice],
            [s].[cso_cd_then] AS [dealerCode]
        FROM [dbo].[SALES_TB] [s]
        JOIN [dbo].[PRODUCT_TB] [p]
            ON [s].[drug_cd] = [p].[drug_cd]
            AND [s].[sales_index] BETWEEN [p].[start_index] AND [p].[end_index]
        WHERE [s].[sales_index] BETWEEN @startSalesIndex AND @maxSalesIndex
    )
    SELECT 
        [h].[hospitalAbbreviation] AS [hospital],
        [a].[productGroup] AS [productGroup],
        [a].[salesYear] AS [year],
        [a].[salesMonth] AS [month],
        SUM([a].[drugCount] * [a].[drugPrice]) AS [total],
        [c].[cso_dealer_nm] AS [dealer]
    FROM filteredSales [a]
    JOIN authenticatedHospitals [h] ON [a].[sfaCode] = [h].[sfaCode]
    LEFT JOIN [dbo].[CSO_TB] [c] ON [a].[dealerCode] = [c].[cso_cd]
    WHERE [h].[hospitalName] LIKE '%' + @hospitalName + '%'
    GROUP BY [h].[hospitalAbbreviation], [a].[productGroup], [a].[salesYear], [a].[salesMonth], [c].[cso_dealer_nm]
    ORDER BY [a].[salesYear] DESC, [a].[salesMonth] DESC, [a].[productGroup];
END
ELSE
BEGIN
    -- 비관리자 이메일: 해당 이메일로 연결된 거래처만 조회
    WITH authenticatedCSO AS (
        SELECT [c].[cso_cd] AS [csoCode]
        FROM [dbo].[CSO_TB] [c]
        WHERE [c].[cso_abmail] = @abmail
    ),
    filteredSales AS (
        SELECT 
            [s].[sfa_cd] AS [sfaCode],
            [p].[drug_class] AS [productGroup], -- 품목군
            [s].[sales_year] AS [salesYear],
            [s].[sales_month] AS [salesMonth],
            [s].[sales_index] AS [salesIndex],
            [s].[drug_cnt] AS [drugCount],
            [p].[drug_price] AS [drugPrice],
            [s].[cso_cd_then] AS [dealerCode]
        FROM [dbo].[SALES_TB] [s]
        JOIN [dbo].[PRODUCT_TB] [p]
            ON [s].[drug_cd] = [p].[drug_cd]
            AND [s].[sales_index] BETWEEN [p].[start_index] AND [p].[end_index]
        WHERE [s].[sales_index] BETWEEN @startSalesIndex AND @maxSalesIndex
          AND [s].[cso_cd_then] IN (SELECT [csoCode] FROM authenticatedCSO)
    ),
    authenticatedHospitals AS (
        SELECT DISTINCT 
            [h].[sfa_cd] AS [sfaCode], 
            [h].[hos_abbr] AS [hospitalAbbreviation], 
            [h].[hos_name] AS [hospitalName]
        FROM [dbo].[HOSPITAL_TB] [h]
        WHERE [h].[sfa_cd] IN (SELECT DISTINCT [sfaCode] FROM filteredSales)
    )
    SELECT 
        [h].[hospitalAbbreviation] AS [hospital],
        [a].[productGroup] AS [productGroup],
        [a].[salesYear] AS [year],
        [a].[salesMonth] AS [month],
        SUM([a].[drugCount] * [a].[drugPrice]) AS [total],
        [c].[cso_dealer_nm] AS [dealer]
    FROM filteredSales [a]
    JOIN authenticatedHospitals [h] ON [a].[sfaCode] = [h].[sfaCode]
    LEFT JOIN [dbo].[CSO_TB] [c] ON [a].[dealerCode] = [c].[cso_cd]
    WHERE [h].[hospitalName] LIKE '%' + @hospitalName + '%'
    GROUP BY [h].[hospitalAbbreviation], [a].[productGroup], [a].[salesYear], [a].[salesMonth], [c].[cso_dealer_nm]
    ORDER BY [a].[salesYear] DESC, [a].[salesMonth] DESC, [a].[productGroup];
END
