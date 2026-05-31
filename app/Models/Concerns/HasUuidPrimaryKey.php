<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

/**
 * Modely s UUID primárním klíčem ($incrementing = false) musí ID nastavit před insertem,
 * jinak Eloquent nezná hodnotu z DB defaultu a FK (venue_id, menu_id, …) zůstanou null.
 *
 * @phpstan-require-extends Model
 */
trait HasUuidPrimaryKey
{
    protected static function bootHasUuidPrimaryKey(): void
    {
        Event::listen('eloquent.creating: '.static::class, static function (Model $model): void {
            $key = $model->getKeyName();

            if ($model->getKey() === null || $model->getKey() === '') {
                $model->{$key} = (string) Str::uuid();
            }
        });
    }
}
