<?php

namespace App\Livewire\Pages;

use Livewire\Component;

class Content extends Component
{
    public function render()
    {
        return view('livewire.pages.content')
            ->layout('livewire.layout');
    }
}
