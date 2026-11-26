import { bytes } from "https://gnlow.dev/csvore@0.2.1"
import * as z from "https://esm.sh/zod@4.6.7"

import raw from "./a63a6833.csv" with { type: "bytes" }

const str = z.string().trim().optional()
const num = z.coerce.number().finite().optional()
const int = z.coerce.number().int().optional()
const date = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이 아닙니다").optional()
const dateTime = z.string().trim().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, "YYYY-MM-DD HH:mm:ss 형식이 아닙니다").optional()
const reqStr = z.string().trim().min(1)

export const Row = z.object({
    개방자치단체코드: reqStr,
    관리번호: reqStr,
    인허가일자: date,
    인허가취소일자: date,
    영업상태명: reqStr,
    폐업일자: date,
    휴업시작일자: date,
    휴업종료일자: date,
    소재지우편번호: str,
    도로명우편번호: str,
    사업장명: reqStr,
    데이터갱신구분: str,
    건물용도명: str,
    공연장형태구분명: str,
    노래방실수: z.undefined(),
    데이터갱신시점: dateTime,
    도로명주소: str,
    문화사업자구분명: str,
    문화체육업종명: reqStr,
    상세영업상태명: str,
    상세영업상태코드: reqStr,
    시설면적: num,
    영업상태코드: reqStr,
    전화번호: str,
    제작취급품목내용: z.undefined(),
    "좌표정보(X)": num,
    "좌표정보(Y)": num,
    주변환경명: str,
    지번주소: str,
    지상층수: int,
    지역구분명: str,
    지하층수: int,
    청소년실수: z.undefined(),
    총층수: int,
    최초등록시점: date,
    통로너비: num,
    최종수정시점: dateTime,
}).catch(ctx => {
    console.log(ctx.error)
    return undefined as any
})

console.log(
    bytes(raw)
        .decode("euc-kr")
        .csv()
        .parseRow(Row)
        .raw.toArray()
        .filter(x => !x)
)
