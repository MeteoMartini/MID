import {defineConfig} from 'vitest/config';

export default defineConfig({
  test:{
    include:['tests/unit/**/*.test.ts'],
    environment:'node',
    globals:false,
    clearMocks:true,
    coverage:{
      provider:'v8',
      reporter:['text','json-summary','html'],
      reportsDirectory:'coverage',
      include:['src/utci.ts']
    }
  }
});
