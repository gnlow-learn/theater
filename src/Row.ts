import * as z from "https://esm.sh/zod@4.6.7"

const str = z.string().trim().optional()
const num = z.coerce.number().finite().optional()
const int = z.coerce.number().int().nonnegative().optional()
const reqStr = z.string().trim().min(1)

const show = (v: unknown) => (v === undefined ? "undefined" : JSON.stringify(v))

const match = (re: RegExp, msg: string) =>
    z.string().superRefine((raw, ctx) => {
        if (!re.test(raw.trim()))
            ctx.addIssue({ code: "custom", message: `${msg} (받은 값: ${show(raw)})` })
    }).transform((v) => v.trim())

const oneOf = (values: readonly string[]) =>
    z.string().superRefine((raw, ctx) => {
        if (!values.includes(raw.trim()))
            ctx.addIssue({ code: "custom", message: `허용되지 않는 값입니다 (받은 값: ${show(raw)}, 허용: ${values.join("|")})` })
    }).transform((v) => v.trim())

const date = match(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이 아닙니다").optional()
const dateTime = match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, "YYYY-MM-DD HH:mm:ss 형식이 아닙니다").optional()
const zip = match(/^(?:\d{3}-\d{3}|\d{5,6})$/, "우편번호 형식이 아닙니다").optional()
const zip5 = match(/^\d{5}$/, "5자리 우편번호가 아닙니다").optional()
const phone = match(/^\d{8,11}$/, "8~11자리 숫자가 아닙니다").optional()
const coordX = z.coerce.number().finite().gt(-20000).lt(700000).optional()
const coordY = z.coerce.number().finite().gt(-60000).lt(600000).optional()

export const Row = z.object({
    개방자치단체코드: match(/^\d{7}$/, "7자리 자치단체코드가 아닙니다"),
    관리번호: match(/^CDFF4220\d{12}$/, "관리번호 형식(CDFF4220 + 12자리)이 아닙니다"),
    인허가일자: date,
    인허가취소일자: date,
    영업상태명: oneOf(["영업/정상", "휴업", "폐업", "취소/말소/만료/정지/중지"]),
    폐업일자: date,
    휴업시작일자: date,
    휴업종료일자: date,
    소재지우편번호: zip,
    도로명우편번호: zip5,
    사업장명: reqStr,
    데이터갱신구분: oneOf(["I", "U"]),
    건물용도명: str,
    공연장형태구분명: oneOf(["영화관", "자동차극장"]).optional(),
    노래방실수: z.undefined(),
    데이터갱신시점: dateTime,
    도로명주소: str,
    문화사업자구분명: str,
    문화체육업종명: oneOf(["영화상영관"]),
    상세영업상태명: oneOf(["영업중", "폐업", "휴업", "직권말소", "허가취소", "지정취소", "등록취소", "신고취소", "영업장폐쇄"]).optional(),
    상세영업상태코드: z.union([z.literal("BBBB"), match(/^\d{2}$/, "2자리 코드가 아닙니다")]),
    시설면적: num,
    영업상태코드: oneOf(["01", "02", "03", "04"]),
    전화번호: phone,
    제작취급품목내용: z.undefined(),
    "좌표정보(X)": coordX,
    "좌표정보(Y)": coordY,
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
})

export const RowStrict = Row.superRefine((r, ctx) => {
    const bad = (path: string[], message: string) => ctx.addIssue({ code: "custom", path, message })
    const after = (a?: string, b?: string) => !!(a && b && a > b)

    const NAME: Record<string, string> = {
        "01": "영업/정상",
        "02": "휴업",
        "03": "폐업",
        "04": "취소/말소/만료/정지/중지",
    }

    if (NAME[r.영업상태코드] !== r.영업상태명)
        bad(["영업상태명"], `영업상태코드 ${show(r.영업상태코드)}와 상태명 ${show(r.영업상태명)}이 맞지 않습니다`)

    if (r.영업상태코드 === "01" && r.폐업일자)
        bad(["폐업일자"], `영업중인데 폐업일자가 있습니다 (영업상태코드: ${show(r.영업상태코드)}, 폐업일자: ${show(r.폐업일자)})`)

    if (after(r.인허가일자, r.폐업일자))
        bad(["폐업일자"], `폐업일자(${show(r.폐업일자)})가 인허가일자(${show(r.인허가일자)})보다 빠릅니다`)
    if (after(r.인허가일자, r.인허가취소일자))
        bad(["인허가취소일자"], `취소일자(${show(r.인허가취소일자)})가 인허가일자(${show(r.인허가일자)})보다 빠릅니다`)
    if (after(r.최초등록시점, r.최종수정시점))
        bad(["최종수정시점"], `최종수정시점(${show(r.최종수정시점)})이 최초등록시점(${show(r.최초등록시점)})보다 빠릅니다`)

    if (!!r.휴업시작일자 !== !!r.휴업종료일자)
        bad(["휴업종료일자"], `휴업시작/종료일자는 함께 있어야 합니다 (시작: ${show(r.휴업시작일자)}, 종료: ${show(r.휴업종료일자)})`)
    if (after(r.휴업시작일자, r.휴업종료일자))
        bad(["휴업종료일자"], `휴업종료일자(${show(r.휴업종료일자)})가 시작일(${show(r.휴업시작일자)})보다 빠릅니다`)

    if (r.총층수 != null) {
        if (r.지상층수 != null && r.지상층수 > r.총층수)
            bad(["지상층수"], `지상층수(${show(r.지상층수)})가 총층수(${show(r.총층수)})보다 큽니다`)
        if (r.지하층수 != null && r.지하층수 > r.총층수)
            bad(["지하층수"], `지하층수(${show(r.지하층수)})가 총층수(${show(r.총층수)})보다 큽니다`)
    }
})
