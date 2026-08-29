<?php

class ProfileSessionService
{
    public function login(string $name, string $email, string $type): void
    {
        setcookie('wonderland_profile_name', $name, time() + 86400, '/');
        setcookie('wonderland_profile_email', $email, time() + 86400, '/');
        setcookie('wonderland_profile_type', $type, time() + 86400, '/');
    }

    public function logout(): void
    {
        $this->clearCookie('wonderland_profile_name');
        $this->clearCookie('wonderland_profile_email');
        $this->clearCookie('wonderland_profile_type');
    }

    private function clearCookie(string $name): void
    {
        setcookie($name, '', time() - 3600, '/');
        unset($_COOKIE[$name]);
    }
}
