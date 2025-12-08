<?php

namespace App\Livewire\Pages;

use Livewire\Component;

class MyApp extends Component
{
    public function render()
    {
        return view('livewire.pages.my-app')
            ->layout('livewire.layout');
    }
}
