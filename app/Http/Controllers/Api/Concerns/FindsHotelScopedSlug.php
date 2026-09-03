<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

trait FindsHotelScopedSlug
{
    protected function currentHotel(?Request $request = null): Hotel
    {
        $slug = Hotel::requestedSlug($request);

        return Hotel::query()->where('slug', $slug)->firstOrFail();
    }

    /**
     * @template T of Model
     *
     * @param  class-string<T>  $model
     * @return T
     */
    protected function findByHotelSlug(string $model, string $slug, ?Request $request = null): Model
    {
        $hotel = $this->currentHotel($request);

        return $model::query()
            ->where('hotel_id', $hotel->id)
            ->where('slug', $slug)
            ->firstOrFail();
    }

    /**
     * @param  class-string<Model>  $model
     */
    protected function uniqueSlugPerHotel(string $model, Hotel $hotel, ?string $ignoreId = null): Unique
    {
        $rule = Rule::unique($model, 'slug')->where('hotel_id', $hotel->id);
        if ($ignoreId) {
            $rule->ignore($ignoreId);
        }

        return $rule;
    }
}
