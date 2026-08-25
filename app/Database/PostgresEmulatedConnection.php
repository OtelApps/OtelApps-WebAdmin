<?php

namespace App\Database;

use DateTimeInterface;
use Illuminate\Database\PostgresConnection;

/**
 * Supabase transaction pooler (6543) vyžaduje PDO::ATTR_EMULATE_PREPARES.
 * Laravel ale booleany převádí na 0/1 → Postgres padá na `boolean = integer`.
 * Tady booleany posíláme jako 'true'/'false'.
 */
class PostgresEmulatedConnection extends PostgresConnection
{
    public function prepareBindings(array $bindings)
    {
        $grammar = $this->getQueryGrammar();

        foreach ($bindings as $key => $value) {
            if ($value instanceof DateTimeInterface) {
                $bindings[$key] = $value->format($grammar->getDateFormat());
            } elseif (is_bool($value)) {
                $bindings[$key] = $value ? 'true' : 'false';
            }
        }

        return $bindings;
    }
}
