<?php
// One function for every Sparetext call, with PHP's own cURL extension: it returns the decoded answer,
// or throws SparetextError with the API's own error code and message.
//   require __DIR__ . '/sparetext.php';
//   sparetext('POST', '/messages', ['to' => '+12025550123', 'text' => 'Your order is ready for pickup.']);

function sparetext(string $method, string $path, ?array $payload = null, array $headers = []): array
{
    $server = getenv('SPARETEXT_SERVER') ?: 'https://sparetext.dev';
    $ch = curl_init("$server/api/v1$path");
    $retryAfter = null;
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => array_merge([
            'x-api-key: ' . getenv('SPARETEXT_API_KEY'),
            'content-type: application/json',
        ], $headers),
        CURLOPT_POSTFIELDS => $payload === null ? null : json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$retryAfter) {
            if (stripos($line, 'retry-after:') === 0) {
                $retryAfter = (int) trim(substr($line, 12));
            }
            return strlen($line);
        },
    ]);
    $raw = curl_exec($ch);
    if ($raw === false) {
        throw new RuntimeException('Network error: ' . curl_error($ch));
    }
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $body = $raw === '' ? [] : json_decode($raw, true);
    if ($status >= 400) {
        throw new SparetextError($status, $body['error']['code'] ?? 'error', $body['error']['message'] ?? "HTTP $status", $retryAfter);
    }
    return $body;
}

class SparetextError extends RuntimeException
{
    public int $status;
    public string $errorCode;
    public ?int $retryAfter;

    public function __construct(int $status, string $errorCode, string $message, ?int $retryAfter)
    {
        parent::__construct("$status $errorCode: $message");
        $this->status = $status;
        $this->errorCode = $errorCode;
        $this->retryAfter = $retryAfter;
    }
}

/**
 * Sends one text, safe to retry: the same Idempotency-Key on every try, so a timeout followed by a
 * retry can't text someone twice, and a 429 waits as long as Retry-After says.
 */
function sparetext_send(array $payload, int $tries = 4): array
{
    $key = bin2hex(random_bytes(16));
    for ($attempt = 1; ; $attempt++) {
        try {
            return sparetext('POST', '/messages', $payload, ["idempotency-key: $key"]);
        } catch (SparetextError $e) {
            if ($e->status !== 429 || $e->retryAfter === null || $attempt >= $tries) {
                throw $e; // a bad number or a daily key limit won't fix itself
            }
            sleep($e->retryAfter);
        } catch (RuntimeException $e) {
            if ($attempt >= $tries) {
                throw $e;
            }
            sleep($attempt);
        }
    }
}
