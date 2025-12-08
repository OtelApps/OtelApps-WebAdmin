<?php

namespace App\Livewire\Pages;

use Livewire\Component;

class Feedback extends Component
{
    public function render()
    {
        return view('livewire.pages.feedback')
            ->layout('livewire.layout');
    }
}
