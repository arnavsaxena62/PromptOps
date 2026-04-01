import tiktoken
from openrouter_client import get_model_pricing

def tokenCount(inputstring, model):
    enc = tiktoken.get_encoding_for_model(model)
    return len(
        [enc.decode_single_token_bytes(token) for token in enc.encode(inputstring)]
    )

def getPromptPricing(prompt, model):
    tokenamount = tokenCount(prompt, model)
    pricing = get_model_pricing(model)
    return tokenamount * pricing["prompt_per_token"]

def getResponsePricing(response, model):
    tokenamount = tokenCount(response, model)
    pricing = get_model_pricing(model)
    return tokenamount * pricing["completion_per_token"]
