<?php

namespace App\Livewire\Navigation;

use App\Services\ModuleService;
use Livewire\Component;

class Sidebar extends Component
{
    public $expandedSections = ['facilities'];
    public $activeSection = null;

    public function toggleSection($section)
    {
        if (in_array($section, $this->expandedSections)) {
            $this->expandedSections = array_diff($this->expandedSections, [$section]);
        } else {
            $this->expandedSections[] = $section;
        }
    }

    public function render()
    {
        $modules = ModuleService::getSidebarModules();
        
        return view('livewire.navigation.sidebar', [
            'modules' => $modules,
        ]);
    }
}
