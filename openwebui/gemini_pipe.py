"""
title: Google AI Studio (Gemini) Integration for OpenWebUI
author: CaptResolve
version: 1.0
license: MIT
requirements: pydantic>=2.0.0, aiohttp>=3.8.0
environment_variables:
    - GEMINI_API_KEY (required)
Supports:
- All Gemini models (2.0 and 1.5 series)
- Streaming responses
- Image/multimodal inputs
"""

import json
import logging
import os
from typing import List, Dict, Union, AsyncIterator
from pydantic import BaseModel
from open_webui.utils.misc import pop_system_message
import aiohttp


class Pipe:
    # Using the OpenAI-compatible endpoint
    API_BASE_URL = (
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    )

    class Valves(BaseModel):
        # Modified to read from environment variable via os.getenv
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()

    def __init__(self):
        logging.basicConfig(level=logging.INFO)
        self.type = "manifold"
        self.id = "gemini"
        self.valves = self.Valves()

    def get_gemini_models(self) -> List[dict]:
        """Return all supported Gemini models"""
        models = [
            # Gemini 2.0 models
            {
                "id": "gemini/gemini-2.0-flash",
                "name": "gemini-2.0-flash",
                "context_length": 1048576,  # 1M tokens
                "supports_vision": True,
                "description": "Next generation features, speed, and multimodal for diverse tasks",
            },
            {
                "id": "gemini/gemini-2.0-flash-lite",
                "name": "gemini-2.0-flash-lite",
                "context_length": 1048576,
                "supports_vision": True,
                "description": "Optimized for cost efficiency and low latency",
            },
            # Gemini 1.5 models
            {
                "id": "gemini/gemini-1.5-flash",
                "name": "gemini-1.5-flash",
                "context_length": 1048576,
                "supports_vision": True,
                "description": "Fast and versatile performance for diverse tasks",
            },
            {
                "id": "gemini/gemini-1.5-flash-8b",
                "name": "gemini-1.5-flash-8b",
                "context_length": 1048576,
                "supports_vision": True,
                "description": "8B parameter model for high volume tasks",
            },
            {
                "id": "gemini/gemini-1.5-pro",
                "name": "gemini-1.5-pro",
                "context_length": 1048576,
                "supports_vision": True,
                "description": "Complex reasoning tasks requiring more intelligence",
            },
        ]
        return models

    def pipes(self) -> List[dict]:
        return self.get_gemini_models()

    async def pipe(
        self, body: Dict, __event_emitter__=None
    ) -> Union[str, AsyncIterator[str]]:
        """Process a request to the Gemini API using the OpenAI-compatible endpoint."""
        if not self.valves.GEMINI_API_KEY:
            error_msg = "Error: GEMINI_API_KEY is required"
            if __event_emitter__:
                await __event_emitter__(
                    {"type": "status", "data": {"description": error_msg, "done": True}}
                )
            return error_msg

        try:
            if __event_emitter__:
                await __event_emitter__(
                    {
                        "type": "status",
                        "data": {"description": "Processing request...", "done": False},
                    }
                )

            system_message, messages = pop_system_message(body["messages"])
            model_name = body["model"].split("/")[-1]

            # Format messages in OpenAI style
            formatted_messages = []

            # Add system message if present
            if system_message:
                formatted_messages.append({"role": "system", "content": system_message})

            # Process other messages
            for message in messages:
                if isinstance(message["content"], str):
                    # Simple text message
                    formatted_messages.append(
                        {"role": message["role"], "content": message["content"]}
                    )
                else:
                    # Handle multimodal content
                    content_parts = []

                    for item in message["content"]:
                        if item["type"] == "text":
                            content_parts.append({"type": "text", "text": item["text"]})
                        elif item["type"] == "image_url" and "url" in item["image_url"]:
                            if item["image_url"]["url"].startswith("data:image"):
                                # Process base64 image
                                mime_type = (
                                    item["image_url"]["url"].split(";")[0].split(":")[1]
                                )
                                base64_data = item["image_url"]["url"].split(",")[1]
                                content_parts.append(
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:{mime_type};base64,{base64_data}"
                                        },
                                    }
                                )
                            else:
                                # Process URL image
                                content_parts.append(
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": item["image_url"]["url"]},
                                    }
                                )

                    formatted_messages.append(
                        {"role": message["role"], "content": content_parts}
                    )

            # Create the payload in OpenAI format
            payload = {
                "model": model_name,
                "messages": formatted_messages,
                "temperature": body.get("temperature", 0.7),
                "top_p": body.get("top_p", 0.95),
                "max_tokens": body.get("max_tokens", 2048),
                "stream": body.get("stream", False),
            }

            # Add authorization header (Bearer token)
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.valves.GEMINI_API_KEY}",
                "X-goog-api-key": self.valves.GEMINI_API_KEY,
            }

            if __event_emitter__:
                await __event_emitter__(
                    {
                        "type": "status",
                        "data": {
                            "description": "Sending request to Gemini API...",
                            "done": False,
                        },
                    }
                )

            # Handle streaming vs non-streaming
            if payload["stream"]:
                return self._handle_streaming(
                    self.API_BASE_URL, headers, payload, __event_emitter__
                )
            else:
                return await self._handle_normal(
                    self.API_BASE_URL, headers, payload, __event_emitter__
                )

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            if __event_emitter__:
                await __event_emitter__(
                    {"type": "status", "data": {"description": error_msg, "done": True}}
                )
            return error_msg

    async def _handle_normal(self, url, headers, payload, __event_emitter__):
        """Handle non-streaming request"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, headers=headers, json=payload, timeout=60
                ) as response:
                    response_text = await response.text()

                    if response.status != 200:
                        error_msg = f"Error: HTTP {response.status}: {response_text}"
                        if __event_emitter__:
                            await __event_emitter__(
                                {
                                    "type": "status",
                                    "data": {"description": error_msg, "done": True},
                                }
                            )
                        return error_msg

                    data = json.loads(response_text)

                    # Extract response text (OpenAI format)
                    if "choices" in data and len(data["choices"]) > 0:
                        response_text = data["choices"][0]["message"]["content"]
                    else:
                        response_text = "No response generated"

                    if __event_emitter__:
                        await __event_emitter__(
                            {
                                "type": "status",
                                "data": {
                                    "description": "Request completed",
                                    "done": True,
                                },
                            }
                        )

                    return response_text
        except Exception as e:
            error_msg = f"Request error: {str(e)}"
            if __event_emitter__:
                await __event_emitter__(
                    {"type": "status", "data": {"description": error_msg, "done": True}}
                )
            return error_msg

    async def _handle_streaming(self, url, headers, payload, __event_emitter__):
        """Handle streaming request (OpenAI format)"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, headers=headers, json=payload, timeout=60
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        error_msg = f"Error: HTTP {response.status}: {error_text}"
                        if __event_emitter__:
                            await __event_emitter__(
                                {
                                    "type": "status",
                                    "data": {"description": error_msg, "done": True},
                                }
                            )
                        yield error_msg
                        return

                    buffer = b""
                    async for chunk in response.content.iter_chunked(1024):
                        buffer += chunk
                        if b"\n" in buffer:
                            lines = buffer.split(b"\n")
                            buffer = lines.pop()

                            for line in lines:
                                line_text = line.decode("utf-8").strip()
                                if not line_text or line_text == "data: [DONE]":
                                    continue

                                if line_text.startswith("data: "):
                                    line_text = line_text[6:]  # Remove "data: " prefix

                                try:
                                    data = json.loads(line_text)
                                    # Extract from OpenAI format
                                    if "choices" in data and len(data["choices"]) > 0:
                                        delta = data["choices"][0].get("delta", {})
                                        if "content" in delta:
                                            yield delta["content"]
                                except json.JSONDecodeError:
                                    continue

                    # Process any remaining data in buffer
                    if buffer:
                        try:
                            line_text = buffer.decode("utf-8").strip()
                            if line_text and line_text != "data: [DONE]":
                                if line_text.startswith("data: "):
                                    line_text = line_text[6:]  # Remove "data: " prefix
                                data = json.loads(line_text)
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    if "content" in delta:
                                        yield delta["content"]
                        except:
                            pass

                    if __event_emitter__:
                        await __event_emitter__(
                            {
                                "type": "status",
                                "data": {
                                    "description": "Stream completed",
                                    "done": True,
                                },
                            }
                        )
        except Exception as e:
            error_msg = f"Stream error: {str(e)}"
            if __event_emitter__:
                await __event_emitter__(
                    {"type": "status", "data": {"description": error_msg, "done": True}}
                )
            yield error_msg
