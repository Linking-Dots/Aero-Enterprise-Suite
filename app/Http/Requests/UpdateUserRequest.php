<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = \App\Models\User::findOrFail($this->route('id'));

        return $this->user()->can('update', $user);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($userId)],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('users')->ignore($userId)],
            'employee_id' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($userId)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'designation_id' => ['nullable', 'exists:designations,id'],
            'attendance_type_id' => ['nullable', 'exists:attendance_types,id'],
            'date_of_joining' => ['nullable', 'date'],
            'birthday' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,other'],
            'address' => ['nullable', 'string', 'max:500'],
            'salary_amount' => ['nullable', 'numeric', 'min:0'],
            'profile_image' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'],
            'user_name' => ['nullable', 'string', 'max:255'],
            'report_to' => ['nullable', 'exists:users,id'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'about' => ['nullable', 'string', 'max:1000'],
            'nid' => ['nullable', 'string', 'max:50'],
            'passport_no' => ['nullable', 'string', 'max:50'],
            'passport_exp_date' => ['nullable', 'date', 'after:today'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'religion' => ['nullable', 'string', 'max:100'],
            'marital_status' => ['nullable', 'in:single,married,divorced,widowed'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'This email address is already registered.',
            'phone.unique' => 'This phone number is already in use.',
            'employee_id.unique' => 'This employee ID already exists.',
            'birthday.before' => 'Birthday must be a date in the past.',
            'passport_exp_date.after' => 'Passport expiration date must be in the future.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'department_id' => 'department',
            'designation_id' => 'designation',
            'attendance_type_id' => 'attendance type',
            'date_of_joining' => 'joining date',
            'salary_amount' => 'salary',
            'report_to' => 'reporting manager',
            'nid' => 'national ID',
        ];
    }
}
