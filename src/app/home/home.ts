import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import projectsData from '../../assets/data/projects.json';
import experienceData from '../../assets/data/experience.json';

type ModalType = 'projects' | 'experience' | 'contact';

interface Experience {
  role: string;
  company: string;
  period: string;
  bullets: string[];
}

interface Project {
  title: string;
  type: string;
  role: string;
  period: string;
  description: string;
  stack: string[];
  projectUrl: string;
  demoUrl: string;
  bullets: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
})
export class Home {
  activeModal: ModalType | null = null;

  contactStatus = '';
  contactSending = false;

  private modalOpener: HTMLElement | null = null;

  readonly techStack: string[] = [
    'Python',
    'TypeScript',
    'JavaScript',
    'SQL',
    'PHP',
    'FastAPI',
    'Flask',
    'Django',
    'Vue.js',
    'Angular',
    'Express.js',
    'Tkinter',
    'Tailwind CSS',
    'Bootstrap',
    'SQLite',
    'Supabase',
    'PostgreSQL',
    'MariaDB',
  ];

  readonly experience: Experience[] = experienceData;
  readonly projects: Project[] = projectsData;

  openModal(modal: ModalType): void {
    this.modalOpener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.activeModal = modal;
    this.contactStatus = '';

    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.activeModal = null;
    this.contactStatus = '';

    document.body.style.overflow = '';

    const opener = this.modalOpener;

    this.modalOpener = null;

    if (opener) {
      setTimeout(() => {
        opener.focus();
      });
    }
  }

  onModalBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  async submitContact(form: NgForm): Promise<void> {
    if (form.invalid || this.contactSending) {
      form.control.markAllAsTouched();
      return;
    }

    const name = String(form.value.name ?? '').trim();
    const email = String(form.value.email ?? '').trim();
    const message = String(form.value.message ?? '').trim();

    this.contactSending = true;
    this.contactStatus = 'Sending...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message ?? 'Unable to send your message.');
      }

      this.contactStatus = 'Message sent successfully. Thank you for reaching out!';

      form.resetForm();
    } catch (error) {
      console.error('Contact form error:', error);

      this.contactStatus =
        error instanceof Error ? error.message : 'Something went wrong while sending your message.';
    } finally {
      this.contactSending = false;
    }
  }
}
