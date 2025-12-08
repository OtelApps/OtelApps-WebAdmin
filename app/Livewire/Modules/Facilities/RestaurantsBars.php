<?php

namespace App\Livewire\Modules\Facilities;

use Livewire\Component;

class RestaurantsBars extends Component
{
    public function render()
    {
        return view('livewire.modules.facilities.restaurants-bars')
            ->layout('livewire.layout');
    }
}
