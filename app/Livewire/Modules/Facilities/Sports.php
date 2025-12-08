<?php

namespace App\Livewire\Modules\Facilities;

use Livewire\Component;

class Sports extends Component
{
    public function render()
    {
        return view('livewire.modules.facilities.sports')
            ->layout('livewire.layout');
    }
}
