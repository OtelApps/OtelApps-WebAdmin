<?php

namespace App\Livewire\Pages;

use Livewire\Component;

class Activity extends Component
{
    public function render()
    {
        return view('livewire.pages.activity')
            ->layout('livewire.layout');
    }
}
