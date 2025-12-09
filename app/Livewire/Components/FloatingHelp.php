<?php

namespace App\Livewire\Components;

use Livewire\Component;

class FloatingHelp extends Component
{
    public $isOpen = false;

    public function toggle()
    {
        $this->isOpen = !$this->isOpen;
    }

    public function render()
    {
        return view('livewire.components.floating-help');
    }
}
