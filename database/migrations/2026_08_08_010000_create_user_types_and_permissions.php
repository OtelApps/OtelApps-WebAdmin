<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->string('color', 32)->nullable();
            $table->string('badge_label', 32)->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('group');
            $table->string('label');
            $table->string('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_type_permission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_type_id')->constrained('user_types')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->unique(['user_type_id', 'permission_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('user_type_id')->nullable()->after('id')->constrained('user_types')->nullOnDelete();
            $table->string('initials', 8)->nullable()->after('name');
            $table->string('job_title')->nullable()->after('initials');
            $table->boolean('is_active')->default(true)->after('remember_token');
            $table->string('availability_status', 32)->default('available')->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_type_id');
            $table->dropColumn(['initials', 'job_title', 'is_active', 'availability_status']);
        });

        Schema::dropIfExists('user_type_permission');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('user_types');
    }
};
