import IParsedRow from "./IParsedRow";

export default interface IParsedRowMessage extends IParsedRow {
  fileId: string;
  elementId: string;
}
