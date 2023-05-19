import { IRequest, ISession } from "./types";

export const request: IRequest = {
  prompt: '',
  max_new_tokens: 350,
  do_sample: true,
  temperature: 0.8,
  top_p: 0.8,
  typical_p: 1,
  repetition_penalty: 1.2,
  top_k: 40,
  min_length: 0,
  no_repeat_ngram_size: 0,
  num_beams: 1,
  penalty_alpha: 0,
  length_penalty: 1,
  early_stopping: false,
  seed: -1,
  add_bos_token: true,
  truncation_length: 2048,
  ban_eos_token: false,
  skip_special_tokens: true,
  stopping_strings: ['\n##', '##']
}

export const session: ISession = {
  userId: '1a2b3c4d5e!1',
  sessionLog: [],
}
