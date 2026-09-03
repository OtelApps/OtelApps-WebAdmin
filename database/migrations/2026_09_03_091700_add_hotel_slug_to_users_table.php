<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('hotel_slug', 80)->nullable()->after('user_type_id');
            $table->index('hotel_slug');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['hotel_slug']);
            $table->dropColumn('hotel_slug');
        });
    }
};
