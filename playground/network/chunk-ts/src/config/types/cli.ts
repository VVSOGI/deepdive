export interface BaseOptions {
  target: string;
  output: string;
}

export interface DecodeOptions {
  decode: string;
}

export type CliOptions = BaseOptions & DecodeOptions;

export type EncodeOptions = BaseOptions;
