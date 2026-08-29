<?php

class JsonStorageService
{
    private string $dataPath;

    public function __construct(string $fileName)
    {
        $this->dataPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . $fileName;
    }

    public function all(): array
    {
        if (!file_exists($this->dataPath)) {
            return [];
        }

        $records = json_decode(file_get_contents($this->dataPath), true);

        return is_array($records) ? $records : [];
    }

    public function saveAll(array $records): void
    {
        file_put_contents($this->dataPath, json_encode($records, JSON_PRETTY_PRINT));
    }
}
