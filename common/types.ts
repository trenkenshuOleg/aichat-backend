export interface IRequest {
  prompt: string,
  max_new_tokens: number,
  do_sample: boolean,
  temperature: number,
  top_p: number,
  typical_p: number,
  repetition_penalty: number,
  top_k: number,
  min_length: number,
  no_repeat_ngram_size: number,
  num_beams: number,
  penalty_alpha: number,
  length_penalty: number,
  early_stopping: boolean,
  seed: number,
  add_bos_token: boolean,
  truncation_length: number,
  ban_eos_token: boolean,
  skip_special_tokens: boolean,
  stopping_strings: string[],
}

export interface ILogMessage {
  sender: 'Assistant' | 'Human',
  message: string;
}

export interface ISession {
  userId: string,
  sessionLog: ILogMessage[],
}
