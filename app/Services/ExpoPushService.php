<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    private const API_URL = 'https://exp.host/--/api/v2/push/send';

    private const CHUNK_SIZE = 100;

    /**
     * @param  array<int, array{to: string, title: string, body: string, data?: array<string, mixed>, sound?: string}>  $messages
     * @return array{sent: int, tickets: array<int, mixed>}
     */
    public function send(array $messages): array
    {
        $messages = array_values(array_filter($messages, fn (array $m) => ! empty($m['to'])));

        if ($messages === []) {
            return ['sent' => 0, 'tickets' => []];
        }

        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        $accessToken = config('services.expo.access_token');
        if ($accessToken) {
            $headers['Authorization'] = 'Bearer '.$accessToken;
        }

        $tickets = [];
        $sent = 0;

        foreach (array_chunk($messages, self::CHUNK_SIZE) as $chunk) {
            try {
                $response = Http::withHeaders($headers)
                    ->timeout(15)
                    ->post(self::API_URL, $chunk);

                if (! $response->successful()) {
                    Log::warning('Expo push request failed', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    continue;
                }

                $data = $response->json('data', []);
                $chunkTickets = is_array($data) ? $data : [];
                foreach ($chunkTickets as $ticket) {
                    if (! is_array($ticket)) {
                        continue;
                    }

                    if (($ticket['status'] ?? null) === 'error') {
                        Log::warning('Expo push ticket error', [
                            'message' => $ticket['message'] ?? 'unknown',
                            'details' => $ticket['details'] ?? null,
                        ]);
                    }
                }

                $tickets = array_merge($tickets, $chunkTickets);
                $sent += count($chunk);
            } catch (\Throwable $e) {
                Log::warning('Expo push exception', ['message' => $e->getMessage()]);
            }
        }

        $this->logReceiptsAsync($tickets);

        return ['sent' => $sent, 'tickets' => $tickets];
    }

    /**
     * @param  array<int, mixed>  $tickets
     */
    private function logReceiptsAsync(array $tickets): void
    {
        $ids = [];
        foreach ($tickets as $ticket) {
            if (is_array($ticket) && ($ticket['status'] ?? null) === 'ok' && ! empty($ticket['id'])) {
                $ids[] = $ticket['id'];
            }
        }

        if ($ids === []) {
            return;
        }

        dispatch(function () use ($ids) {
            try {
                sleep(2);
                $response = Http::withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                    ->timeout(15)
                    ->post('https://exp.host/--/api/v2/push/getReceipts', ['ids' => $ids]);

                if (! $response->successful()) {
                    Log::warning('Expo push receipts request failed', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    return;
                }

                $receipts = $response->json('data', []);
                if (! is_array($receipts)) {
                    return;
                }

                foreach ($receipts as $id => $receipt) {
                    if (! is_array($receipt)) {
                        continue;
                    }

                    if (($receipt['status'] ?? null) === 'error') {
                        Log::warning('Expo push receipt error', [
                            'ticket_id' => $id,
                            'message' => $receipt['message'] ?? 'unknown',
                            'details' => $receipt['details'] ?? null,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Expo push receipts exception', ['message' => $e->getMessage()]);
            }
        })->afterResponse();
    }
}
