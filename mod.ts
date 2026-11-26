import { bytes } from "https://gnlow.dev/csvore@0.2.1"
import raw from "./a63a6833.csv" with { type: "bytes" }
import { Row } from "./src/Row.ts"

;(
    bytes(raw)
        .decode("euc-kr")
        .csv()
        .parseRow(Row.catch(ctx => {
            console.log(ctx.error)
            return undefined as any
        }))
        .raw.toArray()
        .slice(0, 10)
)
