<?php

namespace App\Livewire\Pages;

use Livewire\Component;

class Crm extends Component
{
    public function render()
    {
        return view('livewire.pages.crm')
            ->layout('livewire.layout');
    }
}
