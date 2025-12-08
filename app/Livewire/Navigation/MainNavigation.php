<?php

namespace App\Livewire\Navigation;

use App\Services\ModuleService;
use Livewire\Component;

class MainNavigation extends Component
{
    public $activeTab = 'dashboard';

    public function mount()
    {
        $this->activeTab = request()->route('page', 'dashboard');
    }

    public function setActiveTab($tab)
    {
        $this->activeTab = $tab;
    }

    public function render()
    {
        $modules = ModuleService::getMainNavigation();
        
        return view('livewire.navigation.main-navigation', [
            'modules' => $modules,
        ]);
    }
}
