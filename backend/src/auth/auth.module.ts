import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.SUPABASE_JWT_SECRET,
    }),
  ],
  providers: [SupabaseAuthGuard],
  exports: [JwtModule, SupabaseAuthGuard],
})
export class AuthModule {}
