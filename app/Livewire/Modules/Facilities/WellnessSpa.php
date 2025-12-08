<?php

namespace App\Livewire\Modules\Facilities;

use Livewire\Component;

class WellnessSpa extends Component
{
    public function render()
    {
        return view('livewire.modules.facilities.wellness-spa')
            ->layout('livewire.layout');
    }
}
