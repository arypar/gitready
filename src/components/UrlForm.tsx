'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type UrlType = 'github' | 'docs';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' })
});

interface UrlFormProps {
  onSubmit: (url: string, type: UrlType) => void;
  isLoading: boolean;
}

export default function UrlForm({ onSubmit, isLoading }: UrlFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
    mode: 'onChange',
  });
  
  // Auto-detect URL type
  const detectUrlType = (url: string): UrlType | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('github.com')) {
        return 'github';
      } else {
        return 'docs';
      }
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    const type = detectUrlType(data.url);
    if (type) {
      onSubmit(data.url, type);
    }
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center mb-8">
     
      </div>
      
      <Form {...form}>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative floating-input url-input-hover-glow">
                    <div className="absolute inset-x-0 -bottom-3 h-12 bg-[#161B22]/10 blur-lg rounded-full"></div>
                    <Input
                      placeholder="https://github.com/username/repository"
                      {...field}
                      disabled={isLoading}
                      className="relative bg-transparent border-0 border-b border-[#30363D] rounded-none h-14 px-1 text-lg shadow-none focus-visible:ring-0 focus-visible:border-b-[#388BFD] transition-colors placeholder:text-[#8B949E]/60 font-light"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[#8B949E]">
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-[#388BFD]/60 border-t-transparent rounded-full animate-spin" />
                      ) : form.formState.isValid ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : null}
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-[#F85149] mt-2 text-center" />
              </FormItem>
            )}
          />
          
          <div className="flex justify-center mt-4">
            <Button 
              type="submit" 
              disabled={!form.formState.isValid || isLoading}
              className="bg-[#388BFD] hover:bg-[#388BFD]/90 text-white"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Repository'}
            </Button>
          </div>
          
          <p className="text-xs text-[#8B949E] italic pt-3 text-center">
            {isLoading ? 'Analysis in progress...' : 'Enter a valid GitHub repository URL or documentation link'}
          </p>
        </form>
      </Form>
    </div>
  );
} 